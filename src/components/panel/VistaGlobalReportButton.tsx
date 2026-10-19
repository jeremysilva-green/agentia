"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { copy } from "@/lib/copy";

export function VistaGlobalReportButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/panel/vista-global-report");
        if (!response.ok) throw new Error();

        const disposition = response.headers.get("Content-Disposition") ?? "";
        const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "agentia-vista-global.pdf";

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

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--em)] px-4.5 text-[14.5px] font-semibold text-white shadow-[0_12px_34px_-12px_var(--em-glow)] transition-colors hover:bg-[var(--em-2)] disabled:opacity-60"
      >
        <Download size={16} />
        {isPending ? copy.panel.downloadingMonthlyReport : copy.panel.downloadVistaGlobalReport}
      </button>
      {error && <p className="text-xs text-[#ff8a8a]">{error}</p>}
    </div>
  );
}
