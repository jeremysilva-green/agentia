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
