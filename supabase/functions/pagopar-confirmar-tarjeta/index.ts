// Must be called after the card-catastro redirect, whether it succeeded or
// failed (mandatory per the docs — "Es de carácter obligatorio y necesario
// para el funcionamiento de todo el circuito"). If the card was saved and
// the subscription is currently past_due / trial-expired, immediately
// attempts a charge so the agent doesn't have to wait for the next cron run.
import { createAdminClient, getCallingUser, jsonResponse, corsHeaders } from "../_shared/supabaseAdmin.ts";
import { confirmarTarjeta } from "../_shared/pagopar.ts";
import { chargeSubscription } from "../_shared/chargeSubscription.ts";

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });

  const user = await getCallingUser(request);
  if (!user) return jsonResponse({ error: "No autorizado" }, 401);

  const body = (await request.json().catch(() => ({}))) as { returnUrl?: string; status?: string };
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3000";
  const returnUrl = body.returnUrl ?? `${siteUrl}/panel/suscripcion/tarjeta/resultado`;
  const cardAdded = body.status === "add_new_card_success";

  const service = createAdminClient();

  const { data: agentProfile } = await service.from("agent_profiles").select("pagopar_identificador").eq("id", user.id).single();
  const identificador = agentProfile?.pagopar_identificador;
  if (!identificador) return jsonResponse({ error: "El agente no tiene un identificador de Pagopar asignado." }, 500);

  // Mandatory regardless of success/failure.
  const result = await confirmarTarjeta({ url: returnUrl, identificador });
  if (!result.respuesta) {
    console.error("[pagopar-confirmar-tarjeta] confirmar-tarjeta failed", result.resultado);
  }

  if (!cardAdded) {
    return jsonResponse({ ok: true, tarjetaGuardada: false });
  }

  await service.from("agent_profiles").update({ tarjeta_guardada: true }).eq("id", user.id);

  const { data: subscription } = await service
    .from("subscriptions")
    .select("status, trial_ends_at")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Only auto-charge here if payment is actually overdue: past_due always
  // qualifies, but a "trialing" subscription only qualifies once the trial
  // has actually ended — an agent adding a card proactively mid-trial should
  // NOT be charged early.
  const trialExpired =
    subscription?.status === "trialing" &&
    !!subscription.trial_ends_at &&
    new Date(subscription.trial_ends_at) <= new Date();

  let charged: { success: boolean; error?: string } | null = null;
  if (subscription && (subscription.status === "past_due" || trialExpired)) {
    const chargeResult = await chargeSubscription(user.id);
    charged = chargeResult.success ? { success: true } : { success: false, error: chargeResult.error };
  }

  return jsonResponse({ ok: true, tarjetaGuardada: true, charged });
});
