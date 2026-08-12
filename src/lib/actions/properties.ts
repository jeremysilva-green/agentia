"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { propertySchema } from "@/lib/validations/property";
import { extractLatLngFromMapsUrl } from "@/lib/googleMaps";

export type PropertyActionState = { error?: string } | undefined;

function readPropertyForm(formData: FormData) {
  return propertySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    listingType: formData.get("listingType"),
    propertyType: formData.get("propertyType") || undefined,
    price: formData.get("price"),
    currency: formData.get("currency") || undefined,
    city: formData.get("city"),
    address: formData.get("address") || undefined,
    mapsUrl: formData.get("mapsUrl") || undefined,
    status: formData.get("status") || "available",
    published: formData.get("published") === "on",
    bedrooms: formData.get("bedrooms") || undefined,
    bathrooms: formData.get("bathrooms") || undefined,
    areaM2: formData.get("areaM2") || undefined,
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
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
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
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
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
