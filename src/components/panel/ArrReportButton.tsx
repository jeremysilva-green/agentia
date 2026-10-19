"use client";

import { useState, useTransition } from "react";
import { Download, Lock } from "lucide-react";
import { copy } from "@/lib/copy";

export function ArrReportButton({ eligible, daysRemaining }: { eligible: boolean; daysRemaining: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/panel/arr-report");
        if (!response.ok) throw new Error();

        const disposition = response.headers.get("Content-Disposition") ?? "";
        const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "agentia-reporte-arr.pdf";

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        setError("No se pudo generar el reporte. Intentá de nuevo.");
      }
    });
  }

  if (!eligible) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[var(--line)] bg-white/[0.03] px-3.5 text-[13.5px] font-semibold text-[var(--muted)]"
      >
        <Lock size={15} />
        {copy.panel.arrReportLocked(daysRemaining)}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[var(--em)] px-3.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[var(--em-2)] disabled:opacity-60"
      >
        <Download size={15} />
        {isPending ? copy.panel.downloadingMonthlyReport : copy.panel.arrReportGenerate}
      </button>
      {error && <p className="text-xs text-[#ff8a8a]">{error}</p>}
    </div>
  );
}
