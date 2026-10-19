"use client";

import { useEffect, useState } from "react";

const COLORS = ["#13c47f", "#0a8f5c", "#7dd9b0"];

export function VistaGlobalDonut({ segments }: { segments: { label: string; value: number }[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const R = 50;
  const C = 2 * Math.PI * R;

  const withOffsets = segments.reduce<{ label: string; value: number; len: number; offset: number }[]>((rows, s) => {
    const len = total > 0 ? (s.value / total) * C : 0;
    const prev = rows[rows.length - 1];
    const offset = prev ? prev.offset + prev.len : 0;
    rows.push({ ...s, len, offset });
    return rows;
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-[170px] w-[170px] shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx={60} cy={60} r={R} fill="none" stroke="#ffffff0d" strokeWidth={16} />
          {withOffsets.map((s, i) => (
            <circle
              key={s.label}
              cx={60}
              cy={60}
              r={R}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={mounted ? `${Math.max(s.len - 3, 0)} ${C}` : `0 ${C}`}
              strokeDashoffset={-s.offset}
              style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.2,.7,.2,1)" }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[34px] leading-none font-semibold text-white">{total.toLocaleString("es-PY")}</span>
          <span className="text-xs text-[var(--muted)]">clics</span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2.5">
        {withOffsets.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2.5 text-[13px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 truncate text-[#cfcfcf]">{s.label}</span>
            <b className="font-display text-[15px] text-white">{s.value.toLocaleString("es-PY")}</b>
            <span className="w-9 text-right text-xs text-[var(--muted)]">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
