"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { selectPlan } from "@/lib/actions/subscription";
import { callPagoparFunction } from "@/lib/pagoparFunctions";

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
        const checkout = await callPagoparFunction<{ redirectUrl: string }>("crear-pedido-pagopar");
        window.location.href = checkout.redirectUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = currentPlan === planId;
          const isChoosing = isPending && pendingPlan === planId;
          const soldOut = planId === "fundador" && fundadorSeatsRemaining <= 0 && !isCurrent;

          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border bg-black/30 p-4 backdrop-blur-md transition-transform duration-300 ease-out hover:scale-[1.03]",
                plan.highlighted ? "border-emerald-400 ring-1 ring-emerald-400" : "border-emerald-500/40"
              )}
            >
              <div>
                <p className="text-[10px] font-medium tracking-widest text-emerald-300/80">{plan.eyebrow}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-0.5 text-xs text-slate-300">{plan.tagline}</p>
              </div>

              <div>
                <p className="text-2xl font-bold text-white">
                  {plan.price === 0 ? "Gratis" : `Gs. ${plan.price.toLocaleString("es-PY")}`}
                </p>
                {plan.price > 0 && <p className="text-xs text-slate-400">/mes</p>}
                {planId === "fundador" && (
                  <p className="mt-1 text-xs font-medium text-amber-400">
                    {soldOut ? "Cupos agotados" : `${fundadorSeatsRemaining} cupos restantes de 100`}
                  </p>
                )}
              </div>

              <ul className="flex flex-1 flex-col gap-1.5 text-xs">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                    <span className="text-slate-200">{feature}</span>
                  </li>
                ))}
                {plan.limitations?.map((limitation) => (
                  <li key={limitation} className="flex items-start gap-2">
                    <X size={14} className="mt-0.5 shrink-0 text-slate-500" />
                    <span className="text-slate-500">{limitation}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleChoose(plan.id)}
                disabled={isPending || isCurrent || soldOut}
                className={cn(
                  "flex h-9 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors disabled:cursor-not-allowed",
                  isCurrent || soldOut
                    ? "bg-white/5 text-slate-500"
                    : plan.highlighted
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : planId === "fundador"
                        ? "border border-emerald-400 bg-black text-emerald-400 hover:bg-emerald-400/10"
                        : "border border-white/20 bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isChoosing && <Loader2 size={15} className="animate-spin" />}
                {isCurrent ? "Plan actual" : soldOut ? "Agotado" : isChoosing ? "Redirigiendo..." : "Elegir plan"}
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
