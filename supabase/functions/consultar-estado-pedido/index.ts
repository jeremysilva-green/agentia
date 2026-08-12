// Paso 4 of the standard checkout: the frontend's redirect-back page calls
// this with the `hash` from the URL to show the agent the real payment
// status (never trust the redirect query params alone).
import { createAdminClient, getCallingUser, jsonResponse, corsHeaders } from "../_shared/supabaseAdmin.ts";
import { consultarPedido } from "../_shared/pagopar.ts";

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });

  const user = await getCallingUser(request);
  if (!user) return jsonResponse({ error: "No autorizado" }, 401);

  const { hash } = (await request.json().catch(() => ({}))) as { hash?: string };
  if (!hash) return jsonResponse({ error: "Falta el hash del pedido." }, 400);

  const service = createAdminClient();

  // Ownership check: the hash must belong to this agent's own subscription,
  // so one agent can't probe another agent's order status.
  const { data: subscription } = await service
    .from("subscriptions")
    .select("id, agent_id")
    .eq("agent_id", user.id)
    .eq("pagopar_hash_pedido_actual", hash)
    .maybeSingle();

  if (!subscription) return jsonResponse({ error: "Pedido no encontrado para este usuario." }, 404);

  const result = await consultarPedido(hash);
  if (!result.respuesta) return jsonResponse({ error: result.resultado }, 502);

  return jsonResponse({ resultado: result.resultado });
});
