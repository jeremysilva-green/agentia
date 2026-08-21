import { createServiceClient } from "@/lib/supabase/service";
import { chargeRecurring } from "@/lib/dlocal";
import { PLANS, type PlanId } from "@/lib/plans";

// MIT recurring charge via dLocal — mirrors chargeSubscriptionBancard.
// Reuses the network_payment_reference (+ transaction_link_id for
// Mastercard) saved from the agent's first payment instead of re-prompting
// for card details.
export async function chargeSubscriptionDlocal(
  agentId: string,
  options: { isRetry?: boolean } = {}
): Promise<{ success: true } | { success: false; error: string }> {
  const service = createServiceClient();

  const [{ data: subscription }, { data: agentProfile }, { data: authUser }] = await Promise.all([
    service
      .from("subscriptions")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    service
      .from("agent_profiles")
      .select("*, profiles(full_name, username, phone)")
      .eq("id", agentId)
      .single(),
    service.auth.admin.getUserById(agentId),
  ]);

  if (!subscription) return { success: false, error: "No se encontró la suscripción." };
  if (
    !agentProfile?.tarjeta_guardada ||
    agentProfile.proveedor_tarjeta !== "dLocal" ||
    !agentProfile.dlocal_network_payment_reference
  ) {
    return { success: false, error: "El agente no tiene una tarjeta de dLocal catastrada." };
  }
  // Visa Credit doesn't support MIT in Paraguay per dLocal's docs — skip the
  // doomed API call rather than let it fail against dLocal.
  if (agentProfile.dlocal_recurring_supported === false) {
    return { success: false, error: "La tarjeta guardada no admite cobros recurrentes (Visa Crédito)." };
  }

  const plan = (subscription.plan ?? "basico") as PlanId;
  const amount = PLANS[plan].price;
  if (amount <= 0) return { success: false, error: "El plan actual no requiere cobro." };

  const profile = (
    agentProfile as unknown as { profiles: { full_name: string | null; username: string; phone: string | null } | null }
  ).profiles;
  const orderId = `renov-${agentId.slice(0, 8)}-${Date.now()}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: payment } = await service
    .from("payments")
    .insert({
      subscription_id: subscription.id,
      dlocal_order_id: orderId,
      dlocal_tipo: "recurrente",
      amount,
      currency: "PYG",
      plan,
      status: "initiated",
    })
    .select("id")
    .single();

  const result = await chargeRecurring({
    amount,
    currency: "PYG",
    orderId,
    payer: {
      name: profile?.full_name || profile?.username || "Agente",
      email: authUser.user?.email ?? "",
      document: agentProfile.ruc ?? "",
      phone: profile?.phone ?? "",
    },
    holderName: profile?.full_name || profile?.username || "Agente",
    networkPaymentReference: agentProfile.dlocal_network_payment_reference,
    transactionLinkId: agentProfile.dlocal_transaction_link_id,
    notificationUrl: `${siteUrl}/api/webhooks/dlocal`,
    isRetry: options.isRetry,
  });

  const approved = result.status === "PAID";

  if (payment) {
    await service
      .from("payments")
      .update({
        status: approved ? "approved" : "rejected",
        dlocal_payment_id: result.id ?? null,
        raw_response: result as unknown as never,
      })
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

  return { success: false, error: result.status_detail ?? "Pago rechazado." };
}
