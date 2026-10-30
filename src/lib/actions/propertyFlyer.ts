"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deletePropertyFlyer(propertyId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };

  const { data: flyer } = await supabase
    .from("property_flyers")
    .select("id, storage_path")
    .eq("property_id", propertyId)
    .eq("agent_id", user.id)
    .maybeSingle();
  if (!flyer) return { error: "No se encontró el flyer." };

  const { error: deleteError } = await supabase.from("property_flyers").delete().eq("id", flyer.id);
  if (deleteError) return { error: "No se pudo eliminar el flyer." };

  // Best effort: an orphaned file is harmless, a row without a file is not.
  await supabase.storage.from("property-flyers").remove([flyer.storage_path]);

  revalidatePath("/panel/redes-sociales");
  return { success: true };
}

export async function deleteAffiliateFlyer(propertyId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };

  const { data: flyer } = await supabase
    .from("affiliate_flyers")
    .select("id, storage_path")
    .eq("property_id", propertyId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!flyer) return { error: "No se encontró el flyer." };

  const { error: deleteError } = await supabase.from("affiliate_flyers").delete().eq("id", flyer.id);
  if (deleteError) return { error: "No se pudo eliminar el flyer." };

  await supabase.storage.from("property-flyers").remove([flyer.storage_path]);

  revalidatePath("/panel-afiliado/enlaces");
  return { success: true };
}
