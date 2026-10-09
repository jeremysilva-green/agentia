"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { randomShortCode } from "@/lib/shortCode";

async function getOrCreateCatalogCode(
  service: ReturnType<typeof createServiceClient>,
  agentId: string,
  userId: string
): Promise<string> {
  const { data: existing } = await service
    .from("affiliate_catalogs")
    .select("code")
    .eq("agent_id", agentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing.code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomShortCode();
    const { error } = await service.from("affiliate_catalogs").insert({ code, agent_id: agentId, user_id: userId });
    if (!error) return code;

    if (error.code !== "23505") throw error;

    // Unique violation: either the code collided (rare — retry with a new
    // one) or a concurrent request already created this agent+affiliate's
    // catalogue (a real race) — in that case just fetch and reuse it.
    const { data: raced } = await service
      .from("affiliate_catalogs")
      .select("code")
      .eq("agent_id", agentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (raced) return raced.code;
  }

  throw new Error("No se pudo generar un código único.");
}

export async function createOrGetCatalog(
  agentId: string
): Promise<{ code: string } | { error: string; code?: "auth_required" | "role_invalid" }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Necesitás iniciar sesión como usuario para crear un catálogo.", code: "auth_required" };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "user") {
    return { error: "Solo los afiliados pueden crear catálogos.", code: "role_invalid" };
  }

  const service = createServiceClient();
  const code = await getOrCreateCatalogCode(service, agentId, user.id);

  return { code };
}
