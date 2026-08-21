// Curated, non-exhaustive list of well-known neighborhoods per city — real
// barrio-level data only exists reliably for Asunción here. Other cities
// fall back to free text in the UI rather than presenting an incomplete or
// guessed dropdown as if it were authoritative.
export const BARRIOS_BY_CITY: Record<string, string[]> = {
  Asunción: [
    "Carmelitas",
    "Villa Morra",
    "Manorá",
    "Las Lomas",
    "Recoleta",
    "Mburicaó",
    "Vista Alegre",
    "Sajonia",
    "Trinidad",
    "Herrera",
    "San Vicente",
    "Obrero",
    "Centro",
    "Catedral",
    "Roberto L. Petit",
    "Loma Pytã",
    "Ycuá Satí",
    "Botánico",
    "Ciudad Nueva",
    "Jara",
    "Pinozá",
    "Tembetary",
    "Santísima Trinidad",
    "Villa Aurelia",
    "San Pablo",
    "Zeballos Cué",
  ],
};

export function getBarriosForCity(city: string | null | undefined): string[] {
  if (!city) return [];
  return BARRIOS_BY_CITY[city] ?? [];
}
