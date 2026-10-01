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
type DocKey = (typeof DOC_KEYS)[number];

// Owner documents now upload directly from the browser to Supabase Storage
// via a signed URL (see getAcuerdoDocUploadUrl below) rather than through
// this Server Action — Vercel's Serverless Functions enforce their own
// hard request-body ceiling (independent of next.config.ts's
// serverActions.bodySizeLimit, which only raises Next.js's own check), and
// three phone photos of property documents routinely exceeded it, which is
// exactly what a real owner hit in production. By the time this action
// runs, formData's doc_* fields are just the already-uploaded storage
// paths (plain strings), not file blobs.
function collectDocPaths(formData: FormData) {
  const updates: Partial<Record<DocKey, string>> = {};
  for (const key of DOC_KEYS) {
    const value = formData.get(key);
    if (typeof value === "string" && value.length > 0) updates[key] = value;
  }
  return updates;
}

// Issues a short-lived signed upload URL for one owner document, scoped to
// this agreement's share code — the owner's browser uploads straight to
// Supabase Storage with it, so the file's bytes never pass through a
// Vercel function at all.
export async function getAcuerdoDocUploadUrl(
  shareCode: string,
  docKey: DocKey,
  fileExt: string
): Promise<{ error: string } | { path: string; token: string }> {
  if (!DOC_KEYS.includes(docKey)) return { error: "Documento inválido." };

  const service = createServiceClient();
  const { data: agreement } = await service.from("private_agreements").select("id").eq("share_code", shareCode).single();
  if (!agreement) return { error: "No se encontró el documento." };

  const safeExt = fileExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "bin";
  const path = `${agreement.id}/${docKey}.${safeExt}`;

  const { data, error } = await service.storage.from("acuerdo-documentos").createSignedUploadUrl(path, { upsert: true });
  if (error || !data) return { error: "No se pudo preparar la subida del archivo." };

  return { path: data.path, token: data.token };
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

  const docUpdates = collectDocPaths(formData);

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
