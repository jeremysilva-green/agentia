import { createClient } from "@/lib/supabase/server";
import type { AgentCardData } from "@/types/domain";
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_VALUES, type PropertyType } from "@/lib/constants/propertyTypes";

export type MarketplaceFilters = {
  city?: string;
  listingType?: "rent" | "sale";
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType[];
  q?: string;
};

// Agents type their city (and other free-text fields) without necessarily
// matching the accented canonical spelling used elsewhere (e.g. "Asuncion"
// vs "Asunción"). Comparing on normalized (accent- and case-stripped)
// strings avoids silently dropping matches over a missing tilde.
function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const LISTING_TYPE_LABELS: Record<"rent" | "sale", string> = { sale: "venta", rent: "alquiler" };

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

  // Free-text search matches agent name/city/bio OR anything in any of the
  // agent's own property listings (title, description, city, property type,
  // listing type) — a hit on any one of those is enough, unlike the other
  // filters above which all narrow the result set (AND).
  const q = filters.q?.trim();
  let agentIdsFromPropertySearch: Set<string> | null = null;
  if (q) {
    const normalizedQuery = normalizeText(q);

    const matchingPropertyTypes = PROPERTY_TYPE_VALUES.filter((type) =>
      normalizeText(PROPERTY_TYPE_LABELS[type].es).includes(normalizedQuery)
    );
    const matchingListingTypes = (Object.keys(LISTING_TYPE_LABELS) as ("rent" | "sale")[]).filter((type) =>
      normalizeText(LISTING_TYPE_LABELS[type]).includes(normalizedQuery)
    );

    const { data: searchableProperties } = await supabase
      .from("properties")
      .select("agent_id, title, description, city, property_type, listing_type")
      .eq("published", true);

    agentIdsFromPropertySearch = new Set(
      (searchableProperties ?? [])
        .filter(
          (p) =>
            normalizeText(p.title).includes(normalizedQuery) ||
            normalizeText(p.description).includes(normalizedQuery) ||
            normalizeText(p.city).includes(normalizedQuery) ||
            (p.property_type !== null && matchingPropertyTypes.includes(p.property_type)) ||
            matchingListingTypes.includes(p.listing_type)
        )
        .map((p) => p.agent_id)
    );
  }

  let agentsQuery = supabase
    .from("agent_profiles")
    .select("*, profiles(username, full_name, avatar_url)")
    .eq("is_active", true);

  if (agentIdsFilter) agentsQuery = agentsQuery.in("id", agentIdsFilter);

  agentsQuery = agentsQuery.order("created_at", { ascending: false });

  const { data: agentsRaw } = await agentsQuery;
  let agents = agentsRaw ?? [];

  if (filters.city) {
    const normalizedCity = normalizeText(filters.city);
    agents = agents.filter((a) => a.city && normalizeText(a.city).includes(normalizedCity));
  }

  if (q) {
    const normalizedQuery = normalizeText(q);
    agents = agents.filter((a) => {
      const profile = (
        a as typeof a & { profiles: { username: string; full_name: string | null } | null }
      ).profiles;
      const name = profile?.full_name || profile?.username || "";
      const nameMatch = normalizeText(name).includes(normalizedQuery);
      const cityMatch = Boolean(a.city && normalizeText(a.city).includes(normalizedQuery));
      const bioMatch = Boolean(a.bio && normalizeText(a.bio).includes(normalizedQuery));
      const propertyMatch = agentIdsFromPropertySearch?.has(a.id) ?? false;
      return nameMatch || cityMatch || bioMatch || propertyMatch;
    });
  }

  if (agents.length === 0) return [];

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
