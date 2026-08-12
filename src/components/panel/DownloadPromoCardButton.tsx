"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { downloadPromoCard } from "@/lib/downloadPromoCard";
import { copy } from "@/lib/copy";

export function DownloadPromoCardButton({ propertyId }: { propertyId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function handleClick() {
    setError(false);
    startTransition(async () => {
      try {
        await downloadPromoCard(propertyId);
      } catch {
        setError(true);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        <Download size={11} />
        {isPending ? copy.affiliatePanel.downloadingImage : copy.affiliatePanel.downloadImage}
      </button>
      {error && <p className="text-[11px] text-red-600">Error al descargar</p>}
    </div>
  );
}
