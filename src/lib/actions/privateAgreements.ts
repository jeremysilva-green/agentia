"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { agentAgreementFieldsSchema, ownerAgreementFieldsSchema } from "@/lib/validations/privateAgreement";
import { fieldErrorsFrom } from "@/lib/formErrors";
import type { PrivateAgreement } from "@/types/domain";

export type AgreementActionState = { error?: string; fieldErrors?: Record<string, string>; success?: boolean } | undefined;

function computeStatus(agentSignedAt: string | null, ownerSignedAt: string | null): PrivateAgreement["status"] {
  if (agentSignedAt && ownerSignedAt) return "completed";
  if (agentSignedAt) return "pending_owner";
  return "pending_agent";
}

const DOC_KEYS = ["doc_title", "doc_tax", "doc_id"] as const;

// Uploads whichever of the three optional documents were actually attached
// in this submission, leaving the rest untouched — attaching them is never
// required for the agreement to go through.
async function uploadAttachedDocs(agreementId: string, formData: FormData) {
  const service = createServiceClient();
  const updates: Partial<Record<(typeof DOC_KEYS)[number], string>> = {};

  for (const key of DOC_KEYS) {
    const file = formData.get(key);
    if (!(file instanceof File) || file.size === 0) continue;

    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${agreementId}/${key}.${ext}`;
    const { error } = await service.storage.from("acuerdo-documentos").upload(path, file, { upsert: true });
    if (!error) updates[key] = path;
  }

  return updates;
}

// Agent-initiated: creates a blank agreement pre-filled with the agent's own
// info, so they can fill their side and share the link with the owner.
export async function createAgentAgreement(): Promise<
  { error: string } | { success: true; agreement: PrivateAgreement }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const [{ data: profile }, { data: agentProfile }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, role").eq("id", user.id).single(),
    supabase.from("agent_profiles").select("ruc").eq("id", user.id).single(),
  ]);
  if (profile?.role !== "agent") return { error: "Solo los agentes pueden generar este documento." };

  const service = createServiceClient();
  const { data: agreement, error } = await service
    .from("private_agreements")
    .insert({
      agent_id: user.id,
      agent_name: profile.full_name,
      agent_ruc: agentProfile?.ruc ?? null,
      agent_phone: profile.phone,
      agent_email: user.email ?? null,
    })
    .select("*")
    .single();
  if (error || !agreement) return { error: "No se pudo generar el documento." };

  revalidatePath("/panel/propiedades");
  return { success: true, agreement };
}

export async function saveAgentAgreementFields(
  agreementId: string,
  _prevState: AgreementActionState,
  formData: FormData
): Promise<AgreementActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const { data: existing } = await supabase
    .from("private_agreements")
    .select("agent_id, owner_signed_at")
    .eq("id", agreementId)
    .single();
  if (!existing || existing.agent_id !== user.id) return { error: "No se encontró el documento." };

  const parsed = agentAgreementFieldsSchema.safeParse({
    agent_name: formData.get("agent_name"),
    agent_ruc: formData.get("agent_ruc"),
    agent_phone: formData.get("agent_phone"),
    agent_email: formData.get("agent_email"),
    agent_address: formData.get("agent_address"),
    commission: formData.get("commission"),
    commission_vat_included: formData.get("commission_vat_included"),
    commission_payment_timing: formData.get("commission_payment_timing"),
    commission_payment_other: formData.get("commission_payment_other"),
    reservation_condition: formData.get("reservation_condition"),
    validity_months: formData.get("validity_months"),
    exclusivity: formData.get("exclusivity"),
    auto_renewal: formData.get("auto_renewal"),
    agent_signed_name: formData.get("agent_signed_name"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos", fieldErrors: fieldErrorsFrom(parsed.error) };

  const agentSignedAt = new Date().toISOString();
  const service = createServiceClient();
  const { error } = await service
    .from("private_agreements")
    .update({
      ...parsed.data,
      commission_payment_timing: parsed.data.commission_payment_timing || null,
      exclusivity: parsed.data.exclusivity || null,
      agent_signed_at: agentSignedAt,
      status: computeStatus(agentSignedAt, existing.owner_signed_at),
    })
    .eq("id", agreementId);
  if (error) return { error: "No se pudo guardar. Intentá de nuevo." };

  revalidatePath("/panel/propiedades");
  revalidatePath("/panel/solicitudes");
  revalidatePath("/panel/acuerdos");
  return { success: true };
}

// Owner completing an agent-initiated agreement via its public share link —
// no login required, access is gated by the unguessable share_code.
export async function submitOwnerAgreementByShareCode(
  shareCode: string,
  _prevState: AgreementActionState,
  formData: FormData
): Promise<AgreementActionState> {
  const service = createServiceClient();
  const { data: existing } = await service
    .from("private_agreements")
    .select("id, agent_signed_at")
    .eq("share_code", shareCode)
    .single();
  if (!existing) return { error: "No se encontró el documento." };

  const parsed = ownerAgreementFieldsSchema.safeParse({
    owner1_name: formData.get("owner1_name"),
    owner1_ci: formData.get("owner1_ci"),
    owner2_name: formData.get("owner2_name"),
    owner2_ci: formData.get("owner2_ci"),
    owner_phone: formData.get("owner_phone"),
    owner_email: formData.get("owner_email"),
    owner_address: formData.get("owner_address"),
    property_type: formData.get("property_type"),
    property_city: formData.get("property_city"),
    property_district: formData.get("property_district"),
    property_address: formData.get("property_address"),
    land_area_m2: formData.get("land_area_m2"),
    built_area_m2: formData.get("built_area_m2"),
    finca_number: formData.get("finca_number"),
    padron_number: formData.get("padron_number"),
    sale_price: formData.get("sale_price"),
    sale_price_words: formData.get("sale_price_words"),
    allow_sign: formData.get("allow_sign"),
    owner_signed_name: formData.get("owner_signed_name"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos", fieldErrors: fieldErrorsFrom(parsed.error) };

  const docUpdates = await uploadAttachedDocs(existing.id, formData);

  const ownerSignedAt = new Date().toISOString();
  const { error } = await service
    .from("private_agreements")
    .update({
      ...parsed.data,
      ...docUpdates,
      owner_signed_at: ownerSignedAt,
      status: computeStatus(existing.agent_signed_at, ownerSignedAt),
    })
    .eq("id", existing.id);
  if (error) return { error: "No se pudo guardar. Intentá de nuevo." };

  return { success: true };
}

export async function deleteAgreement(agreementId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const { data: existing } = await supabase
    .from("private_agreements")
    .select("agent_id")
    .eq("id", agreementId)
    .single();
  if (!existing || existing.agent_id !== user.id) return { error: "No se encontró el documento." };

  const service = createServiceClient();
  const { error } = await service.from("private_agreements").delete().eq("id", agreementId);
  if (error) return { error: "No se pudo eliminar. Intentá de nuevo." };

  revalidatePath("/panel/acuerdos");
  return { success: true };
}
