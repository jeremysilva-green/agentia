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
        title={isPending ? copy.affiliatePanel.downloadingImage : copy.affiliatePanel.downloadImage}
        aria-label={isPending ? copy.affiliatePanel.downloadingImage : copy.affiliatePanel.downloadImage}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
      >
        <Download size={13} />
      </button>
      {error && <p className="text-[11px] whitespace-nowrap text-red-600">Error al descargar</p>}
    </div>
  );
}
