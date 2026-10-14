export type PlanId = "basico" | "pro" | "fundador";

export type Plan = {
  id: PlanId;
  eyebrow: string;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  limitations?: string[];
  highlighted?: boolean;
};

const PRO_FEATURES = [
  "Propiedades ilimitadas",
  "Perfil con branding propio",
  "Portfolio del agente",
  "Página individual para cada propiedad",
  "Link de propiedad para compartir por WhatsApp",
  "ChatBot Inteligente",
  "CRM Automatizado",
  "Contratos Digitales",
  "Analíticas",
  "Reportes en PDF",
  "Herramientas de marketing",
  "Botón de contacto por WhatsApp",
  "Gestión de leads",
  "Sistema de referidos/afiliados",
];

// Agents sign up free on Básico (no card required, up to 3 active listings,
// no advanced stats). Fundador carries the exact same feature set as Pro at
// a reduced price, capped at FUNDADOR_SEAT_LIMIT seats — see selectPlan()
// in actions/subscription.ts for where that cap is actually enforced.
export const PLANS: Record<PlanId, Plan> = {
  basico: {
    id: "basico",
    eyebrow: "AGENTIA BÁSICO",
    name: "Básico",
    price: 0,
    tagline: "Para comenzar a publicar y probar Agentia.",
    features: [
      "Portfolio del agente",
      "Página individual para cada propiedad",
      "Link de propiedad para compartir por WhatsApp",
      "Herramientas de marketing",
      "Información y características de la propiedad",
      "ChatBot Inteligente",
      "CRM Automatizado",
      "Contratos Digitales",
      "Sistema de referidos/afiliados",
      "Soporte básico",
    ],
    limitations: ["Hasta 3 propiedades activas", "Sin estadísticas avanzadas"],
  },
  pro: {
    id: "pro",
    eyebrow: "AGENTIA PRO",
    name: "Pro",
    price: 199000,
    tagline: "Todas las herramientas para gestionar, promocionar y vender tus propiedades.",
    features: PRO_FEATURES,
    highlighted: true,
  },
  fundador: {
    id: "fundador",
    eyebrow: "AGENTIA FUNDADOR",
    name: "Fundador",
    price: 149000,
    tagline:
      "Precio exclusivo para los primeros 100 agentes. Todo lo del plan Pro, a precio reducido mientras mantengas activa tu suscripción.",
    features: PRO_FEATURES,
  },
};

export const PLAN_ORDER: PlanId[] = ["basico", "pro", "fundador"];

export const FUNDADOR_SEAT_LIMIT = 100;

export function isPlanId(value: unknown): value is PlanId {
  return value === "basico" || value === "pro" || value === "fundador";
}

// Every Pro/Fundador-gated feature (AI photo enhance, marketing video,
// etc.) must check this, not just subscription.plan — an agent who picks
// a paid plan starts at status "pending" until dLocal Go confirms the
// first charge (see selectPlan() in actions/subscription.ts), and should
// not get paid-tier access before that actually happens. "trialing" is
// included since trial agents already get full paid-tier access during
// their trial window elsewhere in the app (see the suscripcion page).
export function hasActiveProAccess(
  subscription: { plan?: string | null; status?: string | null } | null | undefined
): boolean {
  if (!subscription) return false;
  const planOk = subscription.plan === "pro" || subscription.plan === "fundador";
  const statusOk = subscription.status === "active" || subscription.status === "trialing";
  return planOk && statusOk;
}
