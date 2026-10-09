"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteMarketingVideo(propertyId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };

  const { data: video } = await supabase
    .from("marketing_videos")
    .select("id, storage_path")
    .eq("property_id", propertyId)
    .eq("agent_id", user.id)
    .maybeSingle();
  if (!video) return { error: "No se encontró el video." };

  const { error: storageError } = await supabase.storage.from("marketing-videos").remove([video.storage_path]);
  if (storageError) return { error: "No se pudo eliminar el video." };

  const { error: deleteError } = await supabase.from("marketing_videos").delete().eq("id", video.id);
  if (deleteError) return { error: "El video se borró del almacenamiento pero no del registro." };

  revalidatePath("/panel/redes-sociales");
  revalidatePath(`/panel/propiedades/${propertyId}/editar`);
  return { success: true };
}
