"use client";

import { useEffect, useState } from "react";
import { ArrReportButton } from "@/components/panel/ArrReportButton";

export function AnnualReportCard({
  daysElapsed,
  eligible,
  daysRemaining,
}: {
  daysElapsed: number;
  eligible: boolean;
  daysRemaining: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const R = 34;
  const C = 2 * Math.PI * R;
  const pct = Math.min(1, daysElapsed / 365);

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-[22px] border border-[var(--line)] bg-[radial-gradient(100%_140%_at_100%_0%,#0a8f5c1f,transparent_55%)] bg-[var(--ink-2)] p-6">
      <div className="relative h-[84px] w-[84px] shrink-0">
        <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
          <circle cx={42} cy={42} r={R} fill="none" stroke="#ffffff1a" strokeWidth={8} />
          <circle
            cx={42}
            cy={42}
            r={R}
            fill="none"
            stroke="var(--em-2)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={mounted ? C * (1 - pct) : C}
            style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.2,.7,.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
          <b className="font-display text-xl text-white">{daysElapsed}</b>
          <span className="text-[10px] text-[var(--muted)]">de 365 días</span>
        </div>
      </div>
      <div className="min-w-[220px] flex-1">
        <h3 className="font-display text-[19px] font-semibold text-white">Reporte anual</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">Resumen de los últimos 12 meses, con el total facturado.</p>
      </div>
      <ArrReportButton eligible={eligible} daysRemaining={daysRemaining} />
    </div>
  );
}
