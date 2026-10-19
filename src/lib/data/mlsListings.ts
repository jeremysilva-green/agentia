import { createClient } from "@/lib/supabase/server";
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_VALUES, type PropertyType } from "@/lib/constants/propertyTypes";
import { normalizeText } from "@/lib/text";

const LISTING_TYPE_LABELS: Record<"rent" | "sale", string> = { sale: "venta", rent: "alquiler" };

export type MlsListingWithProperty = {
  id: string;
  cobroke_percent: number;
  authorization_type: "exclusiva" | "no_exclusiva";
  property: {
    id: string;
    title: string;
    city: string;
    address: string | null;
    listing_type: "rent" | "sale";
    property_type: string | null;
    price: number;
    currency: string;
    bedrooms: number | null;
    bathrooms: number | null;
    area_m2: number | null;
    property_images: { storage_path: string; position: number }[];
  };
  private: {
    owner_min_price: number | null;
    exact_address: string | null;
    showing_instructions: string | null;
    documentation_status: string | null;
    notes: string | null;
  } | null;
  agent: {
    id: string;
    full_name: string | null;
    username: string;
    phone: string | null;
  };
};

// Same filter shape and in-memory `q` matching as getAgentProperties
// (src/lib/data/agentPortfolio.ts) — reasonable at the MLS's expected
// small-member scale; move `q` to SQL-side ilike if the member pool grows.
export async function listActiveMlsListings(filters: {
  city?: string;
  propertyType?: PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  q?: string;
}): Promise<MlsListingWithProperty[]> {
  const supabase = await createClient();

  // All filters applied in-memory after fetch (below), not as embedded-
  // resource query filters — same reasoning as getAgentProperties' `q`
  // handling: simpler and lower-risk than PostgREST's embedded-filter
  // syntax across three joined tables, acceptable at this feature's
  // expected small scale.
  const { data } = await supabase
    .from("mls_listings")
    .select(
      `id, cobroke_percent, authorization_type,
       property:properties!inner(id, title, city, address, listing_type, property_type, price, currency, bedrooms, bathrooms, area_m2, property_images(storage_path, position)),
       private:mls_listing_private(owner_min_price, exact_address, showing_instructions, documentation_status, notes),
       agent:agent_profiles!inner(id, profile:profiles!inner(phone, full_name, username))`
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    cobroke_percent: number;
    authorization_type: "exclusiva" | "no_exclusiva";
    property: MlsListingWithProperty["property"];
    private: MlsListingWithProperty["private"] | MlsListingWithProperty["private"][];
    agent: { id: string; profile: { phone: string | null; full_name: string | null; username: string } };
  }>;

  const listings: MlsListingWithProperty[] = rows.map((row) => ({
    id: row.id,
    cobroke_percent: row.cobroke_percent,
    authorization_type: row.authorization_type,
    property: row.property,
    private: Array.isArray(row.private) ? (row.private[0] ?? null) : row.private,
    agent: {
      id: row.agent.id,
      full_name: row.agent.profile.full_name,
      username: row.agent.profile.username,
      phone: row.agent.profile.phone,
    },
  }));

  let filtered = listings;
  if (filters.city) {
    const normalizedCity = normalizeText(filters.city);
    filtered = filtered.filter((l) => normalizeText(l.property.city) === normalizedCity);
  }
  if (filters.propertyType && filters.propertyType.length > 0) {
    filtered = filtered.filter(
      (l) => l.property.property_type !== null && filters.propertyType!.includes(l.property.property_type as PropertyType)
    );
  }
  if (filters.minPrice != null) filtered = filtered.filter((l) => l.property.price >= filters.minPrice!);
  if (filters.maxPrice != null) filtered = filtered.filter((l) => l.property.price <= filters.maxPrice!);

  const q = filters.q?.trim();
  if (!q) return filtered;

  const normalizedQuery = normalizeText(q);
  const matchingPropertyTypes = PROPERTY_TYPE_VALUES.filter((type) =>
    normalizeText(PROPERTY_TYPE_LABELS[type].es).includes(normalizedQuery)
  );
  const matchingListingTypes = (Object.keys(LISTING_TYPE_LABELS) as ("rent" | "sale")[]).filter((type) =>
    normalizeText(LISTING_TYPE_LABELS[type]).includes(normalizedQuery)
  );

  return filtered.filter(
    (l) =>
      normalizeText(l.property.title).includes(normalizedQuery) ||
      normalizeText(l.property.city).includes(normalizedQuery) ||
      (l.property.property_type !== null && matchingPropertyTypes.includes(l.property.property_type as PropertyType)) ||
      matchingListingTypes.includes(l.property.listing_type)
  );
}
