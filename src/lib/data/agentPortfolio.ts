import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_VALUES, type PropertyType } from "@/lib/constants/propertyTypes";
import { normalizeText } from "@/lib/text";

const LISTING_TYPE_LABELS: Record<"rent" | "sale", string> = { sale: "venta", rent: "alquiler" };

export async function getAgentBySlug(slug: string) {
  const supabase = await createClient();
  const { data: agentProfile } = await supabase
    .from("agent_profiles")
    .select("*, profiles(username, full_name, avatar_url, phone)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  return agentProfile;
}

export async function getAgentProperties(
  agentId: string,
  filters: {
    city?: string;
    listingType?: "rent" | "sale";
    propertyType?: PropertyType[];
    minPrice?: number;
    maxPrice?: number;
    q?: string;
  }
) {
  const supabase = await createClient();
  let query = supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("agent_id", agentId)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (filters.city) query = query.eq("city", filters.city);
  if (filters.listingType) query = query.eq("listing_type", filters.listingType);
  if (filters.propertyType && filters.propertyType.length > 0) {
    query = query.in("property_type", filters.propertyType);
  }
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);

  const { data } = await query;
  const properties = data ?? [];

  const q = filters.q?.trim();
  if (!q) return properties;

  // Same free-text matching approach as getMarketplaceAgents: title,
  // description, city, or a property/listing type whose label contains the
  // query — a hit on any one field is enough.
  const normalizedQuery = normalizeText(q);
  const matchingPropertyTypes = PROPERTY_TYPE_VALUES.filter((type) =>
    normalizeText(PROPERTY_TYPE_LABELS[type].es).includes(normalizedQuery)
  );
  const matchingListingTypes = (Object.keys(LISTING_TYPE_LABELS) as ("rent" | "sale")[]).filter((type) =>
    normalizeText(LISTING_TYPE_LABELS[type]).includes(normalizedQuery)
  );

  return properties.filter(
    (p) =>
      normalizeText(p.title).includes(normalizedQuery) ||
      normalizeText(p.description).includes(normalizedQuery) ||
      normalizeText(p.city).includes(normalizedQuery) ||
      (p.property_type !== null && matchingPropertyTypes.includes(p.property_type)) ||
      matchingListingTypes.includes(p.listing_type)
  );
}

export async function getAgentRatingSummary(agentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: ratings }, myRatingResult] = await Promise.all([
    supabase.from("agent_ratings").select("rating").eq("agent_id", agentId),
    user
      ? supabase.from("agent_ratings").select("rating").eq("agent_id", agentId).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const count = ratings?.length ?? 0;
  const avg = count > 0 ? ratings!.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  return { avg, count, myRating: myRatingResult.data?.rating ?? null };
}

export const getPropertyForPublicView = cache(async (propertyId: string) => {
  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select("*, property_images(*), agent_profiles(*, profiles(username, full_name, phone, avatar_url))")
    .eq("id", propertyId)
    .eq("published", true)
    .single();

  return property;
});
