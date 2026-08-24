"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const SHORT_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // no 0/O/1/l/I

function randomShortCode(length = 7) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += SHORT_CODE_CHARS[Math.floor(Math.random() * SHORT_CODE_CHARS.length)];
  }
  return code;
}

async function getOrCreateShortCode(
  service: ReturnType<typeof createServiceClient>,
  propertyId: string,
  agentId: string
): Promise<string> {
  const { data: existing } = await service
    .from("agent_social_shares")
    .select("code")
    .eq("property_id", propertyId)
    .eq("agent_id", agentId)
    .maybeSingle();
  if (existing) return existing.code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomShortCode();
    const { error } = await service
      .from("agent_social_shares")
      .insert({ code, property_id: propertyId, agent_id: agentId });
    if (!error) return code;

    if (error.code !== "23505") throw error;

    // Unique violation: either the code collided (rare — retry with a new
    // one) or a concurrent request already created this property+agent's
    // share (a real race) — in that case just fetch and reuse it.
    const { data: raced } = await service
      .from("agent_social_shares")
      .select("code")
      .eq("property_id", propertyId)
      .eq("agent_id", agentId)
      .maybeSingle();
    if (raced) return raced.code;
  }

  throw new Error("No se pudo generar un código único.");
}

export async function generateAgentShareLink(
  propertyId: string
): Promise<{ shortCode: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("agent_id", user.id)
    .maybeSingle();
  if (!property) return { error: "No se encontró la propiedad." };

  const service = createServiceClient();
  const shortCode = await getOrCreateShortCode(service, propertyId, user.id);

  revalidatePath("/panel/redes-sociales");

  return { shortCode };
}

export async function deleteAgentSocialShare(shareId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const { data: share } = await supabase
    .from("agent_social_shares")
    .select("id, agent_id")
    .eq("id", shareId)
    .maybeSingle();
  if (!share || share.agent_id !== user.id) return { error: "No se encontró el enlace." };

  const service = createServiceClient();
  const { error } = await service.from("agent_social_shares").delete().eq("id", shareId).eq("agent_id", user.id);
  if (error) return { error: "No se pudo eliminar el enlace." };

  revalidatePath("/panel/redes-sociales");
  return { success: true };
}
