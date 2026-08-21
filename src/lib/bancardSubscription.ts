import { createServiceClient } from "@/lib/supabase/service";
import { chargeWithAliasToken } from "@/lib/bancard";
import { PLANS, type PlanId } from "@/lib/plans";

// Direct-Bancard equivalent of chargeSubscription (see the pagopar-* edge
// functions' shared helper) — used by both the renewal cron and the
// webhook's immediate-charge-after-card-save path. Unlike Pagopar's model,
// there's no fresh per-charge card lookup: the alias_token is stored once
// on agent_profiles when the card is tokenized and reused directly here.
export async function chargeSubscriptionBancard(
  agentId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const service = createServiceClient();

  const [{ data: subscription }, { data: agentProfile }] = await Promise.all([
    service
      .from("subscriptions")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    service.from("agent_profiles").select("bancard_alias_token, tarjeta_guardada, proveedor_tarjeta").eq("id", agentId).single(),
  ]);

  if (!subscription) return { success: false, error: "No se encontró la suscripción." };
  if (!agentProfile?.tarjeta_guardada || agentProfile.proveedor_tarjeta !== "Bancard" || !agentProfile.bancard_alias_token) {
    return { success: false, error: "El agente no tiene una tarjeta de Bancard catastrada." };
  }

  const plan = (subscription.plan ?? "basico") as PlanId;
  const amount = PLANS[plan].price;
  if (amount <= 0) return { success: false, error: "El plan actual no requiere cobro." };

  const { data: shopProcessId } = await service.rpc("next_shop_process_id");
  if (!shopProcessId) return { success: false, error: "No se pudo generar el identificador de pago." };

  const { data: payment } = await service
    .from("payments")
    .insert({
      subscription_id: subscription.id,
      bancard_shop_process_id: String(shopProcessId),
      bancard_tipo: "recurrente",
      amount,
      currency: "PYG",
      plan,
      status: "initiated",
    })
    .select("id")
    .single();

  const { approved, raw } = await chargeWithAliasToken({
    shopProcessId,
    amount,
    aliasToken: agentProfile.bancard_alias_token,
    description: `Renovación Agently — Plan ${PLANS[plan].name}`,
  });

  if (payment) {
    await service
      .from("payments")
      .update({ status: approved ? "approved" : "rejected", raw_response: raw as never })
      .eq("id", payment.id);
  }

  if (approved) {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await service
      .from("subscriptions")
      .update({
        status: "active",
        period_start: new Date().toISOString().slice(0, 10),
        period_end: periodEnd.toISOString().slice(0, 10),
      })
      .eq("id", subscription.id);

    await service.from("agent_profiles").update({ is_active: true }).eq("id", agentId);

    return { success: true };
  }

  await service.from("subscriptions").update({ status: "past_due" }).eq("id", subscription.id);
  await service.from("agent_profiles").update({ is_active: false }).eq("id", agentId);

  return { success: false, error: "Pago rechazado." };
}
