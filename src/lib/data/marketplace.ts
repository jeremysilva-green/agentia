import { createClient } from "@/lib/supabase/server";
import type { AgentCardData, PropertyWithImages } from "@/types/domain";
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_VALUES, type PropertyType } from "@/lib/constants/propertyTypes";
import { normalizeText } from "@/lib/text";

export type MarketplaceFilters = {
  city?: string;
  listingType?: "rent" | "sale";
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType[];
  q?: string;
};

const LISTING_TYPE_LABELS: Record<"sale", string> = { sale: "venta" };

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
    const matchingListingTypes = (Object.keys(LISTING_TYPE_LABELS) as "sale"[]).filter((type) =>
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
            matchingListingTypes.includes(p.listing_type as "sale")
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

export type MarketplacePropertyRow = PropertyWithImages & {
  agent_profiles: {
    slug: string;
    profiles: { full_name: string | null; username: string; avatar_url: string | null } | null;
  } | null;
};

// Cross-agent counterpart to getMarketplaceAgents — same filters, same
// "narrow in SQL where cheap, normalizeText-filter city/q in app code"
// split, but returns property rows (joined with the owning agent's slug +
// name for PropertyCard) instead of agent cards. No status filter beyond
// published, matching how a single agent's own portfolio page
// (getAgentProperties) already behaves — sold/rented listings still show.
export async function getMarketplaceProperties(filters: MarketplaceFilters): Promise<MarketplacePropertyRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select("*, property_images(*), agent_profiles(slug, profiles(full_name, username, avatar_url))")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (filters.listingType) query = query.eq("listing_type", filters.listingType);
  if (filters.minPrice) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
  if (filters.propertyType && filters.propertyType.length > 0) {
    query = query.in("property_type", filters.propertyType);
  }

  const { data } = await query;
  let properties = (data ?? []) as unknown as MarketplacePropertyRow[];

  if (filters.city) {
    const normalizedCity = normalizeText(filters.city);
    properties = properties.filter((p) => p.city && normalizeText(p.city).includes(normalizedCity));
  }

  const q = filters.q?.trim();
  if (q) {
    const normalizedQuery = normalizeText(q);
    const matchingPropertyTypes = PROPERTY_TYPE_VALUES.filter((type) =>
      normalizeText(PROPERTY_TYPE_LABELS[type].es).includes(normalizedQuery)
    );
    const matchingListingTypes = (Object.keys(LISTING_TYPE_LABELS) as "sale"[]).filter((type) =>
      normalizeText(LISTING_TYPE_LABELS[type]).includes(normalizedQuery)
    );

    properties = properties.filter((p) => {
      const agentProfile = p.agent_profiles?.profiles;
      const agentName = agentProfile?.full_name || agentProfile?.username || "";
      return (
        normalizeText(p.title).includes(normalizedQuery) ||
        normalizeText(p.description).includes(normalizedQuery) ||
        normalizeText(p.city).includes(normalizedQuery) ||
        normalizeText(agentName).includes(normalizedQuery) ||
        (p.property_type !== null && matchingPropertyTypes.includes(p.property_type as PropertyType)) ||
        matchingListingTypes.includes(p.listing_type as "sale")
      );
    });
  }

  return properties;
}
