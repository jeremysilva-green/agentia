export type PlanId = "basico" | "pro" | "fundador" | "mls";

// Single source of truth for the free-plan limits — used by the property
// cap (actions/properties.ts), the enhancer route, and all upgrade copy.
export const BASICO_PROPERTY_LIMIT = 6;
// Lifetime, not monthly: monthly free tries would teach agents to wait
// instead of upgrade.
export const BASICO_FREE_ENHANCE_TRIES = 3;

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

// Agents sign up free on Básico (no card required, up to BASICO_PROPERTY_LIMIT active listings,
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
    limitations: [
      `Hasta ${BASICO_PROPERTY_LIMIT} propiedades activas`,
      `${BASICO_FREE_ENHANCE_TRIES} mejoras de fotos con IA gratis`,
      "Sin estadísticas avanzadas",
    ],
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
  mls: {
    id: "mls",
    eyebrow: "AGENTIA MLS",
    name: "Plan MLS",
    price: 300000,
    tagline: "Todo lo de Pro, más acceso a la red de cooperación MLS entre agentes de distintas agencias.",
    features: [...PRO_FEATURES, "Acceso a la red de cooperación MLS"],
  },
};

export const PLAN_ORDER: PlanId[] = ["basico", "pro", "fundador", "mls"];

export const FUNDADOR_SEAT_LIMIT = 100;

export function isPlanId(value: unknown): value is PlanId {
  return value === "basico" || value === "pro" || value === "fundador" || value === "mls";
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
  // Plan MLS includes everything Pro has, plus the MLS network — see
  // hasActiveMlsAccess() for the MLS-specific check.
  const planOk = subscription.plan === "pro" || subscription.plan === "fundador" || subscription.plan === "mls";
  const statusOk = subscription.status === "active" || subscription.status === "trialing";
  return planOk && statusOk;
}

export function hasActiveMlsAccess(
  subscription: { plan?: string | null; status?: string | null } | null | undefined
): boolean {
  if (!subscription) return false;
  const planOk = subscription.plan === "mls";
  const statusOk = subscription.status === "active" || subscription.status === "trialing";
  return planOk && statusOk;
}
