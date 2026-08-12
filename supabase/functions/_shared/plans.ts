// Mirrors src/lib/plans.ts (PLANS.<id>.price) on the Next.js side. Edge
// Functions run in a separate Deno project and can't import across runtimes,
// so this must be kept in sync by hand if pricing changes there.
export const PLAN_PRICES_PYG: Record<"independiente" | "exclusivo", number> = {
  independiente: 95000,
  exclusivo: 125000,
};
