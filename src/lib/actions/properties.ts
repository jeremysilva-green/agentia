"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { propertySchema } from "@/lib/validations/property";
import { extractLatLngFromMapsUrl } from "@/lib/googleMaps";
import { fieldErrorsFrom } from "@/lib/formErrors";

export type PropertyActionState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

const BASICO_PROPERTY_LIMIT = 3;

// Only Básico agents are capped — Pro/Fundador are unlimited. "Activas"
// means status="available"; drafts and sold properties don't count against
// the limit, matching the plan copy ("Hasta 3 propiedades activas").
async function checkPropertyLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agentId: string,
  excludePropertyId?: string
): Promise<string | null> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if ((subscription?.plan ?? "basico") !== "basico") return null;

  let query = supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .eq("status", "available");
  if (excludePropertyId) query = query.neq("id", excludePropertyId);

  const { count } = await query;
  if ((count ?? 0) >= BASICO_PROPERTY_LIMIT) {
    return "Alcanzaste el límite de 3 propiedades activas del plan Básico. Actualizá a Pro para publicar sin límites.";
  }
  return null;
}

function readPropertyForm(formData: FormData) {
  return propertySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    listingType: formData.get("listingType"),
    propertyType: formData.get("propertyType") || undefined,
    price: formData.get("price"),
    currency: formData.get("currency") || undefined,
    priceIncludesIva: formData.get("priceIncludesIva") === "on",
    city: formData.get("city"),
    address: formData.get("address") || undefined,
    mapsUrl: formData.get("mapsUrl") || undefined,
    status: formData.get("status") || "available",
    published: formData.get("published") === "on",
    bedrooms: formData.get("bedrooms") || undefined,
    bathrooms: formData.get("bathrooms") || undefined,
    areaM2: formData.get("areaM2") || undefined,
    garage: formData.get("garage") || "false",
    negotiationType: formData.getAll("negotiationType"),
    negotiationDetails: formData.get("negotiationDetails") || undefined,
  });
}

async function resolveMapCoordinates(mapsUrl: string | undefined) {
  if (!mapsUrl) return { lat: null, lng: null, mapsUrl: null, error: null as string | null };

  const coordinates = await extractLatLngFromMapsUrl(mapsUrl);
  if (!coordinates) {
    return {
      lat: null,
      lng: null,
      mapsUrl,
      error: "No pudimos leer la ubicación de ese enlace. Probá copiándolo de nuevo desde Google Maps.",
    };
  }

  return { lat: coordinates.lat, lng: coordinates.lng, mapsUrl, error: null };
}

export async function createProperty(
  _prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const parsed = readPropertyForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  if (parsed.data.status === "available") {
    const limitError = await checkPropertyLimit(supabase, user.id);
    if (limitError) return { error: limitError };
  }

  const map = await resolveMapCoordinates(parsed.data.mapsUrl);
  if (map.error) return { error: map.error };

  const { data, error } = await supabase
    .from("properties")
    .insert({
      agent_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      listing_type: parsed.data.listingType,
      property_type: parsed.data.propertyType ?? null,
      price: parsed.data.price,
      currency: parsed.data.currency,
      price_includes_iva: parsed.data.priceIncludesIva,
      city: parsed.data.city,
      address: parsed.data.address ?? null,
      lat: map.lat,
      lng: map.lng,
      maps_url: map.mapsUrl,
      status: parsed.data.status,
      published: parsed.data.published,
      bedrooms: parsed.data.bedrooms ?? null,
      bathrooms: parsed.data.bathrooms ?? null,
      area_m2: parsed.data.areaM2 ?? null,
      garage: parsed.data.garage,
      negotiation_type: parsed.data.negotiationType,
      negotiation_details: parsed.data.negotiationDetails ?? null,
      sold_at: parsed.data.status === "sold" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear la propiedad. Intentá de nuevo." };

  revalidatePath("/panel/propiedades");
  redirect(`/panel/propiedades/${data.id}/editar`);
}

export async function updateProperty(
  propertyId: string,
  _prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const parsed = readPropertyForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  if (parsed.data.status === "available") {
    const limitError = await checkPropertyLimit(supabase, user.id, propertyId);
    if (limitError) return { error: limitError };
  }

  const map = await resolveMapCoordinates(parsed.data.mapsUrl);
  if (map.error) return { error: map.error };

  const { data: current } = await supabase
    .from("properties")
    .select("status, sold_at")
    .eq("id", propertyId)
    .eq("agent_id", user.id)
    .single();

  const soldAt =
    parsed.data.status === "sold"
      ? (current?.sold_at ?? new Date().toISOString())
      : null;

  const { error } = await supabase
    .from("properties")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      listing_type: parsed.data.listingType,
      property_type: parsed.data.propertyType ?? null,
      price: parsed.data.price,
      currency: parsed.data.currency,
      price_includes_iva: parsed.data.priceIncludesIva,
      city: parsed.data.city,
      address: parsed.data.address ?? null,
      lat: map.lat,
      lng: map.lng,
      maps_url: map.mapsUrl,
      status: parsed.data.status,
      published: parsed.data.published,
      bedrooms: parsed.data.bedrooms ?? null,
      bathrooms: parsed.data.bathrooms ?? null,
      area_m2: parsed.data.areaM2 ?? null,
      garage: parsed.data.garage,
      negotiation_type: parsed.data.negotiationType,
      negotiation_details: parsed.data.negotiationDetails ?? null,
      sold_at: soldAt,
    })
    .eq("id", propertyId)
    .eq("agent_id", user.id);

  if (error) return { error: "No se pudo guardar los cambios." };

  revalidatePath("/panel/propiedades");
  revalidatePath(`/panel/propiedades/${propertyId}/editar`);
  return undefined;
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId)
    .eq("agent_id", user.id);

  if (error) return { error: "No se pudo eliminar la propiedad." };

  revalidatePath("/panel/propiedades");
  return { success: true };
}
