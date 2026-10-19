"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { downloadPromoCard } from "@/lib/downloadPromoCard";
import { copy } from "@/lib/copy";

// `dark` is purely additive — existing callers that don't pass it keep the
// default light look (e.g. the affiliate panel's AffiliateLinksTable).
export function DownloadPromoCardButton({ propertyId, dark }: { propertyId: string; dark?: boolean }) {
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
        className={
          dark
            ? "inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] text-[#cfcfcf] hover:border-[var(--em)] hover:text-[var(--em-2)] disabled:opacity-60"
            : "inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
        }
      >
        <Download size={13} />
      </button>
      {error && <p className="text-[11px] whitespace-nowrap text-red-600">Error al descargar</p>}
    </div>
  );
}
