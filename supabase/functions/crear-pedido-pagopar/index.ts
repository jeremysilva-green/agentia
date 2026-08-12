// Standard-checkout Paso 1: creates a Pagopar pedido and returns the hosted
// checkout redirect URL. Used for an agent's first payment (end of trial or
// any ad-hoc manual payment) and for renewals when there's no card on file.
import { createAdminClient, getCallingUser, jsonResponse, corsHeaders } from "../_shared/supabaseAdmin.ts";
import { iniciarTransaccion, buildCheckoutRedirectUrl } from "../_shared/pagopar.ts";
import { PLAN_PRICES_PYG } from "../_shared/plans.ts";

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });

  const user = await getCallingUser(request);
  if (!user) return jsonResponse({ error: "No autorizado" }, 401);

  const service = createAdminClient();

  const { data: profile } = await service.from("profiles").select("role, full_name, username, phone").eq("id", user.id).single();
  if (profile?.role !== "agent") return jsonResponse({ error: "Solo los agentes pueden pagar." }, 403);

  const { data: subscription } = await service
    .from("subscriptions")
    .select("*")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) return jsonResponse({ error: "No se encontró la suscripción del agente." }, 404);

  const plan = subscription.plan ?? "independiente";
  const amount = PLAN_PRICES_PYG[plan as "independiente" | "exclusivo"];
  const idPedidoComercio = `chk-${user.id.slice(0, 8)}-${Date.now()}`;

  const pedido = await iniciarTransaccion({
    idPedidoComercio,
    montoTotal: amount,
    comprador: {
      email: user.email ?? "",
      nombre: profile.full_name || profile.username || "Agente",
      telefono: profile.phone ?? "",
    },
  });

  if (!pedido.respuesta) {
    console.error("[crear-pedido-pagopar] iniciar-transaccion failed", pedido.resultado);
    return jsonResponse({ error: `No se pudo iniciar el pago: ${pedido.resultado}` }, 502);
  }

  const hash = pedido.resultado.data;

  await service
    .from("subscriptions")
    .update({ pagopar_hash_pedido_actual: hash, pagopar_numero_pedido_actual: idPedidoComercio })
    .eq("id", subscription.id);

  await service.from("payments").insert({
    subscription_id: subscription.id,
    amount,
    currency: "PYG",
    plan,
    status: "initiated",
    pagopar_tipo: "checkout",
    pagopar_hash_pedido: hash,
    pagopar_numero_pedido_comercio: idPedidoComercio,
  });

  return jsonResponse({ redirectUrl: buildCheckoutRedirectUrl(hash) });
});
