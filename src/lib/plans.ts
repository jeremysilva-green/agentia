export type PlanId = "independiente" | "exclusivo";

export type Plan = {
  id: PlanId;
  eyebrow: string;
  name: string;
  price: number;
  features: string[];
  highlighted?: boolean;
};

// Two agent tiers, chosen at registration time — Independiente for agents
// managing their own portfolio, Exclusivo for agents who want priority
// placement and exclusive leads.
export const PLANS: Record<PlanId, Plan> = {
  independiente: {
    id: "independiente",
    eyebrow: "AGENTE INDEPENDIENTE",
    name: "Independiente",
    price: 95000,
    features: [
      "Página de portafolio propia",
      "CRM de leads y ventas",
      "Galería de fotos y orden por ciudad",
      "Chatbot básico + WhatsApp Business",
      "Links de afiliación estándar",
    ],
  },
  exclusivo: {
    id: "exclusivo",
    eyebrow: "AGENTE EXCLUSIVO",
    name: "Exclusivo",
    price: 125000,
    highlighted: true,
    features: [
      "Todo lo del plan Independiente",
      "Prioridad en resultados de búsqueda",
      "Leads exclusivos, sin compartir con otros agentes",
      "Chatbot avanzado con calificación de leads",
      "Links de afiliación con catálogo ampliado",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["independiente", "exclusivo"];

export function isPlanId(value: unknown): value is PlanId {
  return value === "independiente" || value === "exclusivo";
}
