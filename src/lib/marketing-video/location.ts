// properties has no barrio column — only city/address — so the location
// line uses the same [address, city] convention already used in
// src/lib/data/social-image-property.ts for the single-property OG card.
export function formatLocationLine({ city, address }: { city: string; address: string | null }): string {
  return [address, city].filter(Boolean).join(", ");
}
