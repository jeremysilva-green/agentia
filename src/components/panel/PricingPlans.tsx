"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Crown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { selectPlan } from "@/lib/actions/subscription";
import { MlsNetworkDiagram } from "@/components/panel/mls/MlsNetworkDiagram";

const INTRO_LINE: Partial<Record<PlanId, string>> = {
  pro: "Todo lo del Básico, más:",
  fundador: "Todo lo del Plan Pro",
};

// Curated, presentational-only checklist per card — intentionally not the
// same as PLANS[id].features (that array drives real entitlement copy
// elsewhere and lists every feature exhaustively, including ones already
// implied by a lower tier). This mirrors the design exactly: Básico's own
// list, then only each paid tier's net-new highlights.
const DISPLAY_FEATURES: Record<PlanId, string[]> = {
  basico: [
    "Portfolio del agente",
    "Página individual para cada propiedad",
    "Link de propiedad para compartir por WhatsApp",
    "Herramientas de marketing",
    "Información y características de la propiedad",
    "ChatBot Inteligente",
    "CRM Automatizado",
    "Contratos Digitales",
  ],
  pro: ["Propiedades ilimitadas", "Perfil con branding propio", "Analíticas", "Reportes en PDF", "Video automático", "Gestión de leads"],
  fundador: ["Precio fundador mientras tu suscripción esté activa", "Solo para los primeros 100 agentes"],
  mls: [],
};

export function PricingPlans({
  currentPlan,
  fundadorSeatsRemaining,
}: {
  currentPlan?: PlanId | null;
  fundadorSeatsRemaining: number;
}) {
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChoose(planId: PlanId) {
    setError(null);
    setPendingPlan(planId);
    startTransition(async () => {
      const result = await selectPlan(planId);
      if (result?.error) {
        setError(result.error);
        return;
      }

      if (planId === "basico") return;

      try {
        const response = await fetch("/api/checkout/dlocal-go", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planId }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "No se pudo iniciar el pago.");
        window.location.href = data.redirectUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-stretch gap-4 sm:grid-cols-2">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = currentPlan === planId;
          const isChoosing = isPending && pendingPlan === planId;
          const soldOut = planId === "fundador" && fundadorSeatsRemaining <= 0 && !isCurrent;
          const isFundador = planId === "fundador";
          const isPro = planId === "pro";
          const isMls = planId === "mls";

          const seatsPct = Math.round((fundadorSeatsRemaining / 100) * 100);

          const button = (
            <button
              type="button"
              onClick={() => handleChoose(plan.id)}
              disabled={isPending || isCurrent || soldOut}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-[14.5px] font-semibold transition-colors disabled:cursor-not-allowed",
                isCurrent || soldOut
                  ? isFundador
                    ? "bg-white/15 text-white/60"
                    : "border border-[var(--line)] bg-white/[0.03] text-[var(--muted)]"
                  : isFundador
                    ? "bg-white text-[var(--em)] hover:bg-[#eafff5]"
                    : isPro
                      ? "bg-[var(--em)] text-white shadow-[0_12px_30px_-12px_var(--em-glow)] hover:bg-[var(--em-2)]"
                      : "border border-[var(--line)] bg-white/[0.04] text-white hover:border-[var(--em)] hover:text-[var(--em-2)]"
              )}
            >
              {isChoosing && <Loader2 size={15} className="animate-spin" />}
              {isCurrent
                ? "Plan actual"
                : soldOut
                  ? "Agotado"
                  : isChoosing
                    ? "Redirigiendo..."
                    : isFundador
                      ? (
                        <>
                          Elegir plan <ArrowRight size={16} />
                        </>
                      )
                      : `Elegir ${plan.name}`}
            </button>
          );

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col gap-3.5 overflow-hidden rounded-[22px] p-6 transition-transform duration-300 hover:-translate-y-1.5",
                isFundador
                  ? "border border-transparent bg-gradient-to-br from-[#13b06e] via-[#0a8f5c] to-[#05613d] text-white shadow-[0_40px_80px_-40px_var(--em-glow)]"
                  : isPro
                    ? "border border-[var(--em)] bg-[var(--ink-2)] shadow-[0_40px_80px_-40px_var(--em-glow)]"
                    : "border border-[var(--line)] bg-[var(--ink-2)]"
              )}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-display text-[22px] font-semibold text-white">
                    {isFundador && <Crown size={19} />}
                    {plan.name}
                  </h3>
                  {(isPro || isFundador) && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold tracking-wide whitespace-nowrap uppercase",
                        isFundador ? "bg-white text-[var(--em)]" : "bg-[var(--em)] text-white"
                      )}
                    >
                      {isFundador ? "Cupos limitados" : "Más completo"}
                    </span>
                  )}
                </div>
                <p className={cn("mt-1.5 text-[13.5px]", isFundador ? "text-[#e3f8ee]" : "text-[var(--muted)]")}>{plan.tagline}</p>
              </div>

              <div>
                <p className="font-display text-[clamp(30px,3vw,38px)] font-semibold text-white">
                  {plan.price === 0 ? "Gratis" : `Gs. ${plan.price.toLocaleString("es-PY")}`}
                </p>
                {plan.price > 0 && <p className={cn("text-[13px]", isFundador ? "text-[#e3f8ee]" : "text-[var(--muted)]")}>/mes</p>}
              </div>

              {isFundador && (
                <div className="flex flex-col gap-2">
                  <div className="h-[7px] overflow-hidden rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${seatsPct}%` }} />
                  </div>
                  <span className="text-[13px] font-semibold text-white">
                    {soldOut ? "Cupos agotados" : `${fundadorSeatsRemaining} cupos restantes de 100`}
                  </span>
                  {button}
                </div>
              )}

              {isMls ? (
                <div className="flex flex-1 items-center justify-center py-2">
                  <div className="w-full max-w-[200px] scale-90">
                    <MlsNetworkDiagram />
                  </div>
                </div>
              ) : (
                <ul className="flex flex-1 flex-col gap-2 text-[13px]">
                  {INTRO_LINE[planId] && (
                    <li className="flex items-start gap-2">
                      <Check size={14} className={cn("mt-0.5 shrink-0", isFundador ? "text-white" : "text-[var(--em-2)]")} />
                      <span className="font-semibold text-white">{INTRO_LINE[planId]}</span>
                    </li>
                  )}
                  {DISPLAY_FEATURES[planId].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check size={14} className={cn("mt-0.5 shrink-0", isFundador ? "text-white" : "text-[var(--em-2)]")} />
                      <span className={isFundador ? "text-[#effcf6]" : "text-[#cfcfcf]"}>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {!isFundador && <div className="mt-auto">{button}</div>}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-[#ff8a8a]">{error}</p>}
    </div>
  );
}
