// Daily cron target (see supabase/migrations/0020_pagopar_cron.sql for the
// pg_cron schedule). Not user-facing — authenticated via a shared secret
// header instead of a user JWT, since nobody is logged in when this runs.
//
// Selects subscriptions that are due: trialing subscriptions whose trial
// just ended, or active subscriptions whose period_end is today or earlier.
// For each: charge if a card is on file, otherwise mark past_due so the
// agent knows to pay manually via the standard checkout redirect.
import { createAdminClient, jsonResponse } from "../_shared/supabaseAdmin.ts";
import { chargeSubscription } from "../_shared/chargeSubscription.ts";

function isAuthorized(request: Request) {
  const bearer = request.headers.get("authorization");
  const expected = Deno.env.get("CRON_SHARED_SECRET");
  return Boolean(expected) && bearer === `Bearer ${expected}`;
}

Deno.serve(async (request: Request) => {
  if (!isAuthorized(request)) return jsonResponse({ error: "No autorizado" }, 401);

  const service = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const [{ data: trialsDue }, { data: renewalsDue }] = await Promise.all([
    service.from("subscriptions").select("id, agent_id").eq("status", "trialing").lte("trial_ends_at", now),
    service.from("subscriptions").select("id, agent_id").eq("status", "active").lte("period_end", today),
  ]);

  const due = [...(trialsDue ?? []), ...(renewalsDue ?? [])];
  const results: { agentId: string; success: boolean; error?: string }[] = [];

  for (const subscription of due) {
    const { data: agentProfile } = await service
      .from("agent_profiles")
      .select("tarjeta_guardada")
      .eq("id", subscription.agent_id)
      .single();

    if (!agentProfile?.tarjeta_guardada) {
      await service.from("subscriptions").update({ status: "past_due" }).eq("id", subscription.id);
      await service.from("agent_profiles").update({ is_active: false }).eq("id", subscription.agent_id);
      results.push({ agentId: subscription.agent_id, success: false, error: "Sin tarjeta catastrada" });
      console.log(`[pagopar-cobro-mensual] agent ${subscription.agent_id}: sin tarjeta, marcado past_due`);
      continue;
    }

    const result = await chargeSubscription(subscription.agent_id);
    results.push({ agentId: subscription.agent_id, success: result.success, error: "error" in result ? result.error : undefined });

    if (!result.success) {
      console.error(`[pagopar-cobro-mensual] agent ${subscription.agent_id}: cobro falló — ${result.error}`);
      // TODO: notify the agent (email/in-app) once a notification provider
      // is wired up — same gap as the existing subscriptions-check cron.
    } else {
      console.log(`[pagopar-cobro-mensual] agent ${subscription.agent_id}: cobro exitoso`);
    }
  }

  return jsonResponse({ ok: true, processed: due.length, results });
});
