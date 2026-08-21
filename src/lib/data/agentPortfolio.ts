import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PropertyType } from "@/lib/constants/propertyTypes";

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
  return data ?? [];
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
