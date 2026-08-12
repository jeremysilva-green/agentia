import { createClient } from "@/lib/supabase/server";
import type { AgentCardData } from "@/types/domain";
import type { PropertyType } from "@/lib/constants/propertyTypes";

export type MarketplaceFilters = {
  city?: string;
  listingType?: "rent" | "sale";
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType[];
};

// Agents type their city as free text at signup, so stored values don't
// always match the accented canonical names in CITY_OPTIONS (e.g. "Asuncion"
// vs "Asunción"). Comparing on normalized (accent- and case-stripped) strings
// avoids silently dropping matches over a missing tilde.
function normalizeCity(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export async function getMarketplaceAgents(filters: MarketplaceFilters): Promise<AgentCardData[]> {
  const supabase = await createClient();

  let agentIdsFilter: string[] | null = null;
  if (filters.listingType || filters.minPrice || filters.maxPrice || (filters.propertyType && filters.propertyType.length > 0)) {
    let propertyQuery = supabase.from("properties").select("agent_id").eq("published", true);
    if (filters.listingType) propertyQuery = propertyQuery.eq("listing_type", filters.listingType);
    if (filters.minPrice) propertyQuery = propertyQuery.gte("price", filters.minPrice);
    if (filters.maxPrice) propertyQuery = propertyQuery.lte("price", filters.maxPrice);
    if (filters.propertyType && filters.propertyType.length > 0) {
      propertyQuery = propertyQuery.in("property_type", filters.propertyType);
    }

    const { data } = await propertyQuery;
    agentIdsFilter = Array.from(new Set((data ?? []).map((p) => p.agent_id)));
    if (agentIdsFilter.length === 0) return [];
  }

  let agentsQuery = supabase
    .from("agent_profiles")
    .select("*, profiles(username, full_name, avatar_url)")
    .eq("is_active", true);

  if (agentIdsFilter) agentsQuery = agentsQuery.in("id", agentIdsFilter);

  agentsQuery = agentsQuery.order("created_at", { ascending: false });

  const { data: agentsRaw } = await agentsQuery;
  const agents = filters.city
    ? (agentsRaw ?? []).filter((a) => a.city && normalizeCity(a.city).includes(normalizeCity(filters.city!)))
    : agentsRaw;
  if (!agents || agents.length === 0) return [];

  const ids = agents.map((a) => a.id);
  const [{ data: props }, { data: ratings }] = await Promise.all([
    supabase.from("properties").select("agent_id, status").in("agent_id", ids).eq("published", true),
    supabase.from("agent_ratings").select("agent_id, rating").in("agent_id", ids),
  ]);

  const counts = new Map<string, { available: number; sold: number }>();
  for (const p of props ?? []) {
    const current = counts.get(p.agent_id) ?? { available: 0, sold: 0 };
    if (p.status === "available") current.available += 1;
    if (p.status === "sold") current.sold += 1;
    counts.set(p.agent_id, current);
  }

  const ratingTotals = new Map<string, { sum: number; count: number }>();
  for (const r of ratings ?? []) {
    const current = ratingTotals.get(r.agent_id) ?? { sum: 0, count: 0 };
    current.sum += r.rating;
    current.count += 1;
    ratingTotals.set(r.agent_id, current);
  }

  return agents.map((agent) => {
    const { profiles, ...agentFields } = agent as typeof agent & {
      profiles: { username: string; full_name: string | null; avatar_url: string | null } | null;
    };
    const ratingTotal = ratingTotals.get(agent.id);
    return {
      ...agentFields,
      profile: profiles ?? { username: "", full_name: null, avatar_url: null },
      available_count: counts.get(agent.id)?.available ?? 0,
      sold_count: counts.get(agent.id)?.sold ?? 0,
      rating_avg: ratingTotal ? ratingTotal.sum / ratingTotal.count : 0,
      rating_count: ratingTotal?.count ?? 0,
    };
  });
}
