import { CITIES_BY_DEPARTMENT } from "@/lib/constants/cities";

// Quick-pick presets for the "Zona de cobertura" multi-select on Modelo de
// Construcción listings — each expands to a set of cities rather than being
// a real selectable value itself.
export const COVERAGE_QUICK_PICKS: { label: string; cities: string[] }[] = [
  {
    label: "Gran Asunción",
    cities: [
      "Asunción",
      "Luque",
      "San Lorenzo",
      "Fernando de la Mora",
      "Lambaré",
      "Mariano Roque Alonso",
    ],
  },
  { label: "Todo Central", cities: [...CITIES_BY_DEPARTMENT.Central, "Asunción"] },
  { label: "Alto Paraná", cities: CITIES_BY_DEPARTMENT["Alto Paraná"] },
  { label: "Itapúa", cities: CITIES_BY_DEPARTMENT.Itapúa },
];

// A Modelo listing's coverage can be dozens of cities (e.g. "Todo Central")
// — too long to list on a compact card. When the selected set exactly
// matches one of the quick-pick presets, show that preset's short label
// instead of enumerating every city; otherwise fall back to the full list
// (a custom, non-preset selection is usually just a handful of cities).
export function getCoverageSummaryLabel(cities: string[]): string {
  if (cities.length === 0) return "";
  const citySet = new Set(cities);
  const matchedPreset = COVERAGE_QUICK_PICKS.find(
    (preset) => preset.cities.length === citySet.size && preset.cities.every((city) => citySet.has(city))
  );
  return matchedPreset ? matchedPreset.label : cities.join(", ");
}
