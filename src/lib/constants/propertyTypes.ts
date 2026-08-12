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
