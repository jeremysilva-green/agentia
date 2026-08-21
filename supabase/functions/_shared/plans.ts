// Mirrors src/lib/plans.ts (PLANS.<id>.price) on the Next.js side. Edge
// Functions run in a separate Deno project and can't import across runtimes,
// so this must be kept in sync by hand if pricing changes there. "basico"
// is free and never reaches these charge paths in normal operation (see
// selectPlan() in src/lib/actions/subscription.ts), but is included here
// for type completeness.
export const PLAN_PRICES_PYG: Record<"basico" | "pro" | "fundador", number> = {
  basico: 0,
  pro: 199000,
  fundador: 149000,
};
