import { createServiceClient } from "@/lib/supabase/service";
import { normalizeText } from "@/lib/text";

// normalizeText alone (accent/case-stripping) isn't enough for an address —
// "Av. Mcal. López 123" vs "Av Mcal Lopez 123" still needs punctuation
// stripped and whitespace collapsed to compare equal. A "." or "," between
// two digits is a thousands separator ("1.234"/"1,234"), not a word
// boundary — it has to be removed rather than turned into a space, or
// "1,234" and "1234" end up as two different tokens ("1" + "234" vs
// "1234") and silently fail to match. Confirmed by testing against a real
// address written both ways.
function normalizeAddress(value: string): string {
  return normalizeText(value)
    .replace(/(\d)[.,](\d)/g, "$1$2")
    .replace(/[.,#º°]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type MlsDuplicateMatch = {
  mlsListingId: string;
  agentId: string;
  propertyId: string;
  propertyTitle: string;
};

// Best-effort "is this the same physical property another member already
// listed" check. There's no reliable geo data in this app (many properties
// have null lat/lng, no PostGIS extension) — this is deliberately text-based
// (city + normalized address + property_type), not a radius check. Fetches
// every other agent's active MLS listings and compares in application code
// rather than a SQL embedded-resource filter — simpler and safe at the
// small scale this feature launches at (same tradeoff already made for the
// MLS browse page's free-text search).
export async function findMlsDuplicate(params: {
  agentId: string;
  city: string;
  address: string | null;
  propertyType: string | null;
}): Promise<MlsDuplicateMatch | null> {
  if (!params.address) return null;

  const service = createServiceClient();
  const normalizedCity = normalizeText(params.city);
  const normalizedAddress = normalizeAddress(params.address);

  const { data: candidates } = await service
    .from("mls_listings")
    .select("id, agent_id, properties(id, title, city, address, property_type)")
    .eq("status", "active")
    .neq("agent_id", params.agentId);

  for (const candidate of candidates ?? []) {
    const prop = candidate.properties as unknown as {
      id: string;
      title: string;
      city: string;
      address: string | null;
      property_type: string | null;
    } | null;
    if (!prop || !prop.address) continue;
    if (prop.property_type !== params.propertyType) continue;
    if (normalizeText(prop.city) !== normalizedCity) continue;
    if (normalizeAddress(prop.address) !== normalizedAddress) continue;

    return { mlsListingId: candidate.id, agentId: candidate.agent_id, propertyId: prop.id, propertyTitle: prop.title };
  }

  return null;
}
