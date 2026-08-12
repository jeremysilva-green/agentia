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
  userId: string,
  ref: string
): Promise<string> {
  const { data: existing } = await service
    .from("short_links")
    .select("code")
    .eq("property_id", propertyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing.code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomShortCode();
    const { error } = await service.from("short_links").insert({ code, property_id: propertyId, user_id: userId, ref });
    if (!error) return code;

    if (error.code !== "23505") throw error;

    // Unique violation: either the code collided (rare — retry with a new
    // one) or a concurrent request already created this property+user's
    // link (a real race) — in that case just fetch and reuse it.
    const { data: raced } = await service
      .from("short_links")
      .select("code")
      .eq("property_id", propertyId)
      .eq("user_id", userId)
      .maybeSingle();
    if (raced) return raced.code;
  }

  throw new Error("No se pudo generar un código único.");
}

export async function generateAffiliateLink(propertyId: string): Promise<
  { ref: string; shortCode: string } | { error: string; code?: "auth_required" | "role_invalid" }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Necesitás iniciar sesión como usuario para compartir.", code: "auth_required" };
  }

  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).single();
  if (profile?.role !== "user") {
    return { error: "Solo los afiliados pueden generar enlaces de afiliado.", code: "role_invalid" };
  }

  const { data: existing } = await supabase
    .from("affiliate_links")
    .select("id")
    .eq("property_id", propertyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("affiliate_links").insert({ property_id: propertyId, user_id: user.id });
    if (error) return { error: "No se pudo generar el enlace. Intentá de nuevo." };
  }

  const service = createServiceClient();
  const shortCode = await getOrCreateShortCode(service, propertyId, user.id, profile.username);

  revalidatePath("/panel-afiliado/enlaces");

  return { ref: profile.username, shortCode };
}

export async function deleteAffiliateLink(linkId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const { data: link } = await supabase
    .from("affiliate_links")
    .select("id, user_id")
    .eq("id", linkId)
    .maybeSingle();
  if (!link || link.user_id !== user.id) return { error: "No se encontró el enlace." };

  const service = createServiceClient();
  const { error } = await service.from("affiliate_links").delete().eq("id", linkId).eq("user_id", user.id);
  if (error) return { error: "No se pudo eliminar el enlace." };

  revalidatePath("/panel-afiliado/enlaces");
  return { success: true };
}
