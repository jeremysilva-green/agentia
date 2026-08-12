// Registers the agent as a Pagopar customer. Idempotent — no-ops if already
// done. Docs note repeating this is harmless anyway, but we still track it
// on agent_profiles.pagopar_cliente_creado to avoid the extra round trip.
import { createAdminClient, getCallingUser, jsonResponse, corsHeaders } from "../_shared/supabaseAdmin.ts";
import { agregarCliente } from "../_shared/pagopar.ts";

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });

  const user = await getCallingUser(request);
  if (!user) return jsonResponse({ error: "No autorizado" }, 401);

  const service = createAdminClient();

  const { data: agentProfile } = await service
    .from("agent_profiles")
    .select("*, profiles(full_name, username, phone)")
    .eq("id", user.id)
    .single();

  if (!agentProfile) return jsonResponse({ error: "Perfil de agente no encontrado." }, 404);
  if (agentProfile.pagopar_cliente_creado) return jsonResponse({ ok: true, alreadyCreated: true });

  const profile = (agentProfile as unknown as { profiles: { full_name: string | null; username: string; phone: string | null } | null }).profiles;
  const identificador = agentProfile.pagopar_identificador;
  if (!identificador) return jsonResponse({ error: "El agente no tiene un identificador de Pagopar asignado." }, 500);

  const result = await agregarCliente({
    identificador,
    nombreApellido: profile?.full_name || profile?.username || "Agente",
    email: user.email ?? "",
    celular: profile?.phone ?? "",
  });

  if (!result.respuesta) {
    console.error("[pagopar-agregar-cliente] failed", result.resultado);
    return jsonResponse({ error: result.resultado }, 502);
  }

  await service.from("agent_profiles").update({ pagopar_cliente_creado: true }).eq("id", user.id);

  return jsonResponse({ ok: true });
});
