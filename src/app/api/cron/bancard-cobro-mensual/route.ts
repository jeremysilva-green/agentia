import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { chargeSubscriptionBancard } from "@/lib/bancardSubscription";

// Direct-Bancard equivalent of the pagopar-cobro-mensual edge function
// (left running in parallel, untouched, in case Pagopar is ever revisited).
// Selects trialing subscriptions whose trial just ended, or active
// subscriptions whose period_end is today or earlier. Only agents with a
// Bancard card on file get charged here; agents without one are marked
// past_due (mirrors subscriptions-check's lapsed-subscription handling).
function isAuthorized(request: Request) {
  const bearer = request.headers.get("authorization");
  return bearer === `Bearer ${process.env.CRON_SECRET}`;
}

async function runBancardCobroMensual() {
  const service = createServiceClient();
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
      .select("tarjeta_guardada, proveedor_tarjeta")
      .eq("id", subscription.agent_id)
      .single();

    if (!agentProfile?.tarjeta_guardada || agentProfile.proveedor_tarjeta !== "Bancard") {
      // No Bancard card on file — either no card at all (subscriptions-check
      // already handles that case) or a Pagopar card, which the Pagopar cron
      // (still running independently) is responsible for.
      continue;
    }

    const result = await chargeSubscriptionBancard(subscription.agent_id);
    results.push({ agentId: subscription.agent_id, success: result.success, error: "error" in result ? result.error : undefined });

    if (!result.success) {
      console.error(`[bancard-cobro-mensual] agent ${subscription.agent_id}: cobro falló — ${result.error}`);
    }
  }

  return { ok: true, processed: results.length, results };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runBancardCobroMensual());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runBancardCobroMensual());
}
