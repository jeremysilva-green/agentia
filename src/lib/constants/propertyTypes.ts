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

// Types only offered on Proyecto en Pozo listings. They are NOT part of
// PROPERTY_TYPE_VALUES on purpose: that list also feeds client_requests and
// Acuerdo Privado, whose own DB constraints don't include these.
export const PROJECT_ONLY_PROPERTY_TYPE_VALUES = ["barrio_cerrado", "condominio", "local_comercial"] as const;

// Every value properties.property_type can hold (see migration 0085).
export const ALL_PROPERTY_TYPE_VALUES = [...PROPERTY_TYPE_VALUES, ...PROJECT_ONLY_PROPERTY_TYPE_VALUES] as const;

export type PropertyType = (typeof ALL_PROPERTY_TYPE_VALUES)[number];

export function isPropertyType(value: string): value is PropertyType {
  return (ALL_PROPERTY_TYPE_VALUES as readonly string[]).includes(value);
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
export const LISTABLE_PROPERTY_TYPE_VALUES = ALL_PROPERTY_TYPE_VALUES.filter(
  (value) => value !== "proyecto_en_pozo"
);

// Which property types the listing form offers per listing kind. Filters keep
// using the full LISTABLE list above so every saved listing stays findable.
export const PROPERTY_TYPES_BY_KIND: Record<"standard" | "proyecto_en_pozo" | "modelo", readonly PropertyType[]> = {
  standard: LISTABLE_PROPERTY_TYPE_VALUES.filter((v) => !(PROJECT_ONLY_PROPERTY_TYPE_VALUES as readonly string[]).includes(v)),
  // Pozo: buildings and projects only — no houses (casa / dúplex / tríplex),
  // no land (estancia / lote / terreno).
  proyecto_en_pozo: LISTABLE_PROPERTY_TYPE_VALUES.filter(
    (v) => !["casa", "duplex", "triplex", "estancia", "lote", "terreno"].includes(v)
  ),
  // Modelo de construcción: houses only (no land, towers or apartments).
  modelo: ["casa", "duplex", "triplex"],
};

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
  barrio_cerrado: { es: "Barrio Cerrado", en: "Gated Community" },
  condominio: { es: "Condominios y Complejos", en: "Condominiums & Complexes" },
  local_comercial: { es: "Local Comercial", en: "Commercial Space" },
};
