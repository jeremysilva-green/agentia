// Requests the card-catastro form data from Pagopar. Calls agregar-cliente
// first (safe to repeat per the docs) so the frontend never has to
// orchestrate two calls itself.
import { createAdminClient, getCallingUser, jsonResponse, corsHeaders } from "../_shared/supabaseAdmin.ts";
import { agregarCliente, agregarTarjeta } from "../_shared/pagopar.ts";

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });

  const user = await getCallingUser(request);
  if (!user) return jsonResponse({ error: "No autorizado" }, 401);

  const body = (await request.json().catch(() => ({}))) as { returnUrl?: string; proveedor?: "Bancard" | "uPay" };
  const proveedor = body.proveedor ?? "Bancard";
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3000";
  const returnUrl = body.returnUrl ?? `${siteUrl}/panel/suscripcion/tarjeta/resultado`;

  const service = createAdminClient();

  const { data: agentProfile } = await service.from("agent_profiles").select("*, profiles(full_name, username, phone)").eq("id", user.id).single();
  if (!agentProfile) return jsonResponse({ error: "Perfil de agente no encontrado." }, 404);

  const identificador = agentProfile.pagopar_identificador;
  if (!identificador) return jsonResponse({ error: "El agente no tiene un identificador de Pagopar asignado." }, 500);

  if (!agentProfile.pagopar_cliente_creado) {
    const profile = (agentProfile as unknown as { profiles: { full_name: string | null; username: string; phone: string | null } | null }).profiles;
    const clienteResult = await agregarCliente({
      identificador,
      nombreApellido: profile?.full_name || profile?.username || "Agente",
      email: user.email ?? "",
      celular: profile?.phone ?? "",
    });
    if (clienteResult.respuesta) {
      await service.from("agent_profiles").update({ pagopar_cliente_creado: true }).eq("id", user.id);
    }
    // Not fatal if this fails — agregar-tarjeta itself may still succeed, and
    // repeating agregar-cliente next time is harmless per the docs.
  }

  const result = await agregarTarjeta({ url: returnUrl, proveedor, identificador });
  if (!result.respuesta) {
    console.error("[pagopar-agregar-tarjeta] failed", result.resultado);
    return jsonResponse({ error: result.resultado }, 502);
  }

  await service.from("agent_profiles").update({ proveedor_tarjeta: proveedor }).eq("id", user.id);

  return jsonResponse({ resultado: result.resultado, proveedor, returnUrl });
});
