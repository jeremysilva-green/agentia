"use client";

import { useState, useTransition } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { generateAffiliateLink } from "@/lib/actions/affiliate";
import { copy } from "@/lib/copy";

export function ShareButton({ propertyId, propertyUrl }: { propertyId: string; propertyUrl: string }) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleShare() {
    setError(null);
    startTransition(async () => {
      const result = await generateAffiliateLink(propertyId);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      const url = new URL(`/s/${result.shortCode}`, new URL(propertyUrl).origin);

      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="group relative">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full hover:bg-emerald-600! hover:text-white! hover:border-emerald-600!"
          onClick={handleShare}
          disabled={isPending}
        >
          {copied ? <Check size={18} /> : <Share2 size={18} />}
          {copied ? copy.property.shareCopied : copy.property.share}
        </Button>
        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg bg-prussian px-3 py-2 text-center text-xs text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {copy.property.shareTooltip}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-prussian" />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
