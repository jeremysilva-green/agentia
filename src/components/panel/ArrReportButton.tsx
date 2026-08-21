"use client";

import { useState, useTransition } from "react";
import { Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
        const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "agently-reporte-arr.pdf";

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
      <Button type="button" size="sm" variant="secondary" disabled className="opacity-60">
        <Lock size={14} />
        {copy.panel.arrReportLocked(daysRemaining)}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={handleClick}
        disabled={isPending}
        className="border-emerald-600! bg-emerald-600! text-white! hover:bg-emerald-700!"
      >
        <Download size={14} />
        {isPending ? copy.panel.downloadingMonthlyReport : copy.panel.arrReportGenerate}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
