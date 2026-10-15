export const PROPERTY_TYPE_VALUES = [
  "casa",
  "departamento",
  "terreno",
  "duplex",
  "triplex",
  "penthouse",
  "edificio",
  "lote",
  "estancia",
  "proyecto_en_pozo",
] as const;

export type PropertyType = (typeof PROPERTY_TYPE_VALUES)[number];

export function isPropertyType(value: string): value is PropertyType {
  return (PROPERTY_TYPE_VALUES as readonly string[]).includes(value);
}

export function parsePropertyTypeParam(value: string | string[] | undefined): PropertyType[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values.filter(isPropertyType);
}

// Proyecto en Pozo is now a listing_kind, not a property_type — no
// `properties` row can have this value anymore (see migration
// 0066_listing_kinds.sql), so it's excluded from every UI that lets someone
// pick among properties' types (the listing form, marketplace/portfolio
// filters). It stays in PROPERTY_TYPE_VALUES itself because
// client_requests.property_type — an independent, unrelated column — still
// legitimately uses it.
export const LISTABLE_PROPERTY_TYPE_VALUES = PROPERTY_TYPE_VALUES.filter(
  (value) => value !== "proyecto_en_pozo"
);

export const PROPERTY_TYPE_LABELS: Record<PropertyType, { es: string; en: string }> = {
  casa: { es: "Casa", en: "House" },
  departamento: { es: "Departamento", en: "Apartment" },
  terreno: { es: "Terreno", en: "Land" },
  duplex: { es: "Dúplex", en: "Duplex" },
  triplex: { es: "Tríplex", en: "Triplex" },
  penthouse: { es: "Penthouse", en: "Penthouse" },
  edificio: { es: "Edificio", en: "Building" },
  lote: { es: "Lote", en: "Lot" },
  estancia: { es: "Estancia", en: "Ranch" },
  proyecto_en_pozo: { es: "Proyecto en Pozo", en: "Off-plan Project" },
};
