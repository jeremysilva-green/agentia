"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";

export function PricingPlans({ currentPlan }: { currentPlan?: PlanId | null }) {
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChoose(plan: PlanId) {
    setError(null);
    setPendingPlan(plan);
    startTransition(async () => {
      const response = await fetch("/api/checkout/bancard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();

      if (!response.ok || !data.redirectUrl) {
        setError(data.error ?? "No se pudo iniciar el pago. Intentá de nuevo.");
        return;
      }

      window.location.href = data.redirectUrl;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = currentPlan === planId;
          const isChoosing = isPending && pendingPlan === planId;

          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col gap-5 rounded-2xl border bg-white p-6 shadow-sm",
                plan.highlighted ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-200"
              )}
            >
              <div>
                <p className="text-[11px] font-medium tracking-widest text-slate-400">{plan.eyebrow}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{plan.name}</h3>
              </div>

              <div>
                <p className="text-3xl font-bold text-slate-900">
                  Gs.&nbsp;{plan.price.toLocaleString("es-PY")}
                </p>
                <p className="text-xs text-slate-500">/mes</p>
              </div>

              <ul className="flex flex-1 flex-col gap-2.5 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleChoose(plan.id)}
                disabled={isPending || isCurrent}
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors disabled:cursor-not-allowed",
                  isCurrent
                    ? "bg-slate-100 text-slate-400"
                    : plan.highlighted
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                )}
              >
                {isChoosing && <Loader2 size={15} className="animate-spin" />}
                {isCurrent ? "Plan actual" : isChoosing ? "Redirigiendo..." : "Elegir plan"}
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
