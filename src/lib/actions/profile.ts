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
    ci: formData.get("ci") || "",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos", fieldErrors: fieldErrorsFrom(parsed.error) };

  const { error } = await supabase
    .from("profiles")
    .update({ alias: parsed.data.alias || null, phone: parsed.data.phone || null, ci: parsed.data.ci || null })
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
    brandName: formData.get("brandName") || "",
    ci: formData.get("ci") || "",
    address: formData.get("address") || "",
    sifenCityId: formData.get("sifenCityId") || "",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos", fieldErrors: fieldErrorsFrom(parsed.error) };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone, ci: parsed.data.ci || null })
    .eq("id", user.id);
  if (profileError) return { error: "No se pudo guardar. Intentá de nuevo." };

  // Fiscal city (SIFEN department/district/city codes) is stored
  // denormalized on agent_profiles — only overwrite those six columns
  // when the agent actually picked one, so re-saving the form without
  // touching this field never clears a previously-saved selection.
  let sifenCityFields = {};
  if (parsed.data.sifenCityId) {
    const { data: sifenCity } = await supabase
      .from("sifen_cities")
      .select("*")
      .eq("id", parsed.data.sifenCityId)
      .maybeSingle();
    if (sifenCity) {
      sifenCityFields = {
        sifen_ciudad_id: sifenCity.ciudad_id,
        sifen_ciudad_desc: sifenCity.ciudad_desc,
        sifen_distrito_id: sifenCity.distrito_id,
        sifen_distrito_desc: sifenCity.distrito_desc,
        sifen_departamento_id: sifenCity.departamento_id,
        sifen_departamento_desc: sifenCity.departamento_desc,
      };
    }
  }

  const { error: agentProfileError } = await supabase
    .from("agent_profiles")
    .update({
      city: parsed.data.city,
      ruc: parsed.data.ruc,
      brand_name: parsed.data.brandName || null,
      address: parsed.data.address || null,
      ...sifenCityFields,
    })
    .eq("id", user.id);
  if (agentProfileError) return { error: "No se pudo guardar. Intentá de nuevo." };

  revalidatePath("/panel/perfil");
  revalidatePath("/panel");
  return { success: true };
}
