"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function VistaGlobalFunnel({ steps }: { steps: { label: string; value: number }[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const first = steps[0]?.value ?? 0;

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => {
        const widthPct = first > 0 ? Math.min(100, (step.value / first) * 100) : 0;
        const prev = i > 0 ? steps[i - 1].value : null;
        const pctOfPrev = prev != null ? (prev > 0 ? Math.round((step.value / prev) * 100) : 0) : null;

        return (
          <div
            key={step.label}
            className="grid grid-cols-[minmax(110px,150px)_1fr_34px_42px] items-center gap-3 text-[13px] sm:grid-cols-[minmax(150px,190px)_1fr_40px_48px]"
          >
            <span className="truncate text-[#cfcfcf]">{step.label}</span>
            <div className="h-[24px] overflow-hidden rounded-[9px] bg-white/[0.06]">
              <div
                className="h-full rounded-[9px] bg-gradient-to-r from-[var(--em)] to-[var(--em-2)] shadow-[0_0_18px_-4px_var(--em-glow)] transition-[width] duration-[1200ms] ease-out"
                style={{ width: mounted ? `${widthPct}%` : "0%", transitionDelay: `${i * 110}ms` }}
              />
            </div>
            <b className="text-right font-display text-[16px] text-white">{step.value.toLocaleString("es-PY")}</b>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold",
                pctOfPrev == null ? "invisible" : "bg-[#13c47f17] text-[var(--em-2)]"
              )}
            >
              {pctOfPrev ?? 0}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
