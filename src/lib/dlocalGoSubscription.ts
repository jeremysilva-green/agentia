import { createServiceClient } from "@/lib/supabase/service";
import { cobrarRecurrente } from "@/lib/dlocalGo";
import { PLANS, type PlanId } from "@/lib/plans";

// dLocal Go equivalent of chargeSubscriptionBancard — used by the monthly
// renewal cron. The charge is submitted here; final approval/rejection is
// resolved asynchronously by the webhook once dLocal Go confirms it, same
// as the checkout flow's first payment.
export async function chargeSubscriptionDlocalGo(
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
    service.from("agent_profiles").select("dlocal_go_checkout_token, tarjeta_guardada, proveedor_tarjeta").eq("id", agentId).single(),
  ]);

  if (!subscription) return { success: false, error: "No se encontró la suscripción." };
  if (!agentProfile?.tarjeta_guardada || agentProfile.proveedor_tarjeta !== "dLocalGo" || !agentProfile.dlocal_go_checkout_token) {
    return { success: false, error: "El agente no tiene una tarjeta de dLocal Go guardada." };
  }

  const plan = (subscription.plan ?? "basico") as PlanId;
  const amount = PLANS[plan].price;
  if (amount <= 0) return { success: false, error: "El plan actual no requiere cobro." };

  const { data: payment, error: insertError } = await service
    .from("payments")
    .insert({
      subscription_id: subscription.id,
      dlocal_go_tipo: "recurrente",
      amount,
      currency: "PYG",
      plan,
      status: "initiated",
    })
    .select("id")
    .single();

  if (insertError || !payment) return { success: false, error: "No se pudo iniciar el cobro." };

  try {
    const result = await cobrarRecurrente({
      merchantCheckoutToken: agentProfile.dlocal_go_checkout_token,
      amount,
      description: `Renovación Agentia — Plan ${PLANS[plan].name}`,
      orderId: payment.id,
    });

    await service.from("payments").update({ dlocal_go_payment_id: result.id }).eq("id", payment.id);

    return { success: true };
  } catch (err) {
    await service
      .from("payments")
      .update({ status: "error", error_message: err instanceof Error ? err.message : "Error desconocido" })
      .eq("id", payment.id);
    return { success: false, error: "No se pudo conectar con dLocal Go." };
  }
}
