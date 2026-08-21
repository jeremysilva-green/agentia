"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, agentProfileSchema } from "@/lib/validations/profile";
import { fieldErrorsFrom } from "@/lib/formErrors";

export type ProfileActionState = { error?: string; fieldErrors?: Record<string, string>; success?: boolean } | undefined;

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
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos", fieldErrors: fieldErrorsFrom(parsed.error) };

  const { error } = await supabase
    .from("profiles")
    .update({ alias: parsed.data.alias || null, phone: parsed.data.phone || null })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar. Intentá de nuevo." };

  revalidatePath("/panel-afiliado/perfil");
  revalidatePath("/panel-afiliado");
  return { success: true };
}

export async function updateAgentProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const parsed = agentProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    ruc: formData.get("ruc"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos", fieldErrors: fieldErrorsFrom(parsed.error) };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone })
    .eq("id", user.id);
  if (profileError) return { error: "No se pudo guardar. Intentá de nuevo." };

  const { error: agentProfileError } = await supabase
    .from("agent_profiles")
    .update({ city: parsed.data.city, ruc: parsed.data.ruc })
    .eq("id", user.id);
  if (agentProfileError) return { error: "No se pudo guardar. Intentá de nuevo." };

  revalidatePath("/panel/perfil");
  revalidatePath("/panel");
  return { success: true };
}
