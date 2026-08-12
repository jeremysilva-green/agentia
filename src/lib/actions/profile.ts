"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/profile";

export type ProfileActionState = { error?: string; success?: boolean } | undefined;

export async function updateAffiliateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const parsed = profileSchema.safeParse({
    alias: formData.get("alias") || "",
    phone: formData.get("phone") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { error } = await supabase
    .from("profiles")
    .update({ alias: parsed.data.alias || null, phone: parsed.data.phone || null })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar. Intentá de nuevo." };

  revalidatePath("/panel-afiliado/perfil");
  revalidatePath("/panel-afiliado");
  return { success: true };
}
