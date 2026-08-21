import { createAdminClient } from "./supabaseAdmin.ts";
import { iniciarTransaccion, listarTarjeta, pagar } from "./pagopar.ts";
import { PLAN_PRICES_PYG } from "./plans.ts";

// Shared by pagopar-cobro-mensual (cron renewals) and
// pagopar-confirmar-tarjeta (immediate charge right after a card is added
// while past_due/trial-expired) so the charge sequence exists in one place.
//
// Runs iniciar-transaccion -> listar-tarjeta -> pagar back-to-back with no
// await gaps beyond the network calls themselves, since the alias_token
// returned by listar-tarjeta expires 15 minutes after issue.
export async function chargeSubscription(
  agentId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const service = createAdminClient();

  const [{ data: subscription }, { data: agentProfile }, { data: authUser }] = await Promise.all([
    service
      .from("subscriptions")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    service.from("agent_profiles").select("*, profiles(full_name, username, phone)").eq("id", agentId).single(),
    service.auth.admin.getUserById(agentId),
  ]);

  if (!subscription) return { success: false, error: "No se encontró la suscripción." };
  if (!agentProfile?.tarjeta_guardada || !agentProfile.pagopar_identificador) {
    return { success: false, error: "El agente no tiene una tarjeta catastrada." };
  }

  const plan = subscription.plan ?? "basico";
  const amount = PLAN_PRICES_PYG[plan as "basico" | "pro" | "fundador"];
  const profile = (agentProfile as unknown as { profiles: { full_name: string | null; username: string; phone: string | null } | null }).profiles;
  const identificador = agentProfile.pagopar_identificador;
  const idPedidoComercio = `renov-${agentId.slice(0, 8)}-${Date.now()}`;

  const pedido = await iniciarTransaccion({
    idPedidoComercio,
    montoTotal: amount,
    descripcion: `Renovacion Agently - Plan ${plan}`,
    comprador: {
      email: authUser.data.user?.email ?? "",
      nombre: profile?.full_name || profile?.username || "Agente",
      telefono: profile?.phone ?? "",
      ruc: agentProfile.ruc ?? undefined,
    },
  });

  if (!pedido.respuesta) {
    await service.from("payments").insert({
      subscription_id: subscription.id,
      amount,
      currency: "PYG",
      plan,
      status: "error",
      pagopar_tipo: "recurrente",
      pagopar_numero_pedido_comercio: idPedidoComercio,
      raw_response: pedido as unknown as never,
    });
    return { success: false, error: `No se pudo iniciar la transacción: ${pedido.resultado}` };
  }

  const hashPedido = pedido.resultado[0].data;

  await service
    .from("subscriptions")
    .update({ pagopar_hash_pedido_actual: hashPedido, pagopar_numero_pedido_actual: idPedidoComercio })
    .eq("id", subscription.id);

  const { data: payment } = await service
    .from("payments")
    .insert({
      subscription_id: subscription.id,
      amount,
      currency: "PYG",
      plan,
      status: "initiated",
      pagopar_tipo: "recurrente",
      pagopar_hash_pedido: hashPedido,
      pagopar_numero_pedido_comercio: idPedidoComercio,
    })
    .select("id")
    .single();

  const tarjetas = await listarTarjeta(identificador);
  if (!tarjetas.respuesta || tarjetas.resultado.length === 0) {
    if (payment) await service.from("payments").update({ status: "error" }).eq("id", payment.id);
    return { success: false, error: "No se encontró una tarjeta catastrada válida." };
  }

  const tarjeta = tarjetas.resultado[0];

  const result = await pagar({
    hashPedido,
    tarjetaAliasToken: tarjeta.alias_token,
    identificador,
  });

  const approved = result.respuesta === true;

  if (payment) {
    await service
      .from("payments")
      .update({
        status: approved ? "approved" : "rejected",
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

  return { success: false, error: typeof result.resultado === "string" ? result.resultado : "Pago rechazado." };
}
