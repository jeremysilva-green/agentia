"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { vendedorRequestSchema, compradorRequestSchema } from "@/lib/validations/clientRequests";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants/propertyTypes";
import type { ClientRequestKind } from "@/lib/constants/clientRequests";
import type { ClientRequest } from "@/types/domain";

export type ClientRequestActionState = { error?: string; success?: boolean } | undefined;

export async function submitClientRequest(
  agentId: string,
  kind: ClientRequestKind,
  _prevState: ClientRequestActionState,
  formData: FormData
): Promise<ClientRequestActionState> {
  const service = createServiceClient();

  const { data: agent } = await service
    .from("agent_profiles")
    .select("id")
    .eq("id", agentId)
    .eq("is_active", true)
    .maybeSingle();
  if (!agent) return { error: "No se encontró el agente." };

  const raw = {
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    propertyType: formData.get("propertyType"),
    city: formData.get("city"),
    description: formData.get("description"),
  };

  if (kind === "vendedor") {
    const parsed = vendedorRequestSchema.safeParse({ ...raw, price: formData.get("price") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const { error } = await service.from("client_requests").insert({
      agent_id: agentId,
      kind: "vendedor",
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      property_type: parsed.data.propertyType,
      city: parsed.data.city,
      description: parsed.data.description,
      price: parsed.data.price,
    });
    if (error) return { error: "No se pudo enviar la solicitud. Intentá de nuevo." };
  } else {
    const parsed = compradorRequestSchema.safeParse({
      ...raw,
      priceMin: formData.get("priceMin"),
      priceMax: formData.get("priceMax"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const { error } = await service.from("client_requests").insert({
      agent_id: agentId,
      kind: "comprador",
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      property_type: parsed.data.propertyType,
      city: parsed.data.city,
      description: parsed.data.description,
      price_min: parsed.data.priceMin,
      price_max: parsed.data.priceMax,
    });
    if (error) return { error: "No se pudo enviar la solicitud. Intentá de nuevo." };
  }

  return { success: true };
}

async function loadOwnPendingRequest(
  requestId: string
): Promise<{ ok: true; request: ClientRequest } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Volvé a ingresar." };

  const { data: request } = await supabase
    .from("client_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!request || request.agent_id !== user.id) return { ok: false, error: "No se encontró la solicitud." };
  if (request.status !== "pending") return { ok: false, error: "Esta solicitud ya fue revisada." };

  return { ok: true, request };
}

export async function approveClientRequest(
  requestId: string
): Promise<{ error: string } | { success: true }> {
  const loaded = await loadOwnPendingRequest(requestId);
  if (!loaded.ok) return { error: loaded.error };
  const { request } = loaded;

  const service = createServiceClient();

  if (request.kind === "vendedor") {
    const propertyType = request.property_type as PropertyType | null;
    const typeLabel = propertyType ? PROPERTY_TYPE_LABELS[propertyType].es : "Propiedad";
    const title = `${typeLabel} en ${request.city}`;

    const { data: property, error: propertyError } = await service
      .from("properties")
      .insert({
        agent_id: request.agent_id,
        title,
        description: request.description,
        listing_type: "sale",
        property_type: propertyType,
        price: request.price ?? 0,
        currency: "PYG",
        city: request.city,
        status: "draft",
        published: false,
      })
      .select("id")
      .single();

    if (propertyError || !property) return { error: "No se pudo crear el borrador de la propiedad." };

    const { error: updateError } = await service
      .from("client_requests")
      .update({ status: "approved", resulting_property_id: property.id })
      .eq("id", requestId);
    if (updateError) return { error: "No se pudo actualizar la solicitud." };

    revalidatePath("/panel/propiedades");
  } else {
    const { error: updateError } = await service
      .from("client_requests")
      .update({ status: "approved" })
      .eq("id", requestId);
    if (updateError) return { error: "No se pudo actualizar la solicitud." };
  }

  revalidatePath("/panel/solicitudes");
  return { success: true };
}

export async function rejectClientRequest(
  requestId: string
): Promise<{ error: string } | { success: true }> {
  const loaded = await loadOwnPendingRequest(requestId);
  if (!loaded.ok) return { error: loaded.error };

  const service = createServiceClient();
  const { error } = await service.from("client_requests").update({ status: "rejected" }).eq("id", requestId);
  if (error) return { error: "No se pudo actualizar la solicitud." };

  revalidatePath("/panel/solicitudes");
  return { success: true };
}
