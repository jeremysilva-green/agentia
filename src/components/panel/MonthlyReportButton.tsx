"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy";

export function MonthlyReportButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/panel/monthly-report");
        if (!response.ok) throw new Error();

        const disposition = response.headers.get("Content-Disposition") ?? "";
        const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "agently-reporte-mensual.pdf";

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
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={handleClick}
        disabled={isPending}
        className="border-emerald-600! bg-emerald-600! text-white! hover:bg-emerald-700!"
      >
        <Download size={14} />
        {isPending ? copy.panel.downloadingMonthlyReport : copy.panel.downloadMonthlyReport}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
