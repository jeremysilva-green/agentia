"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { generateAgentShareLink } from "@/lib/actions/agentSocialShares";

export function AgentShareButton({
  propertyId,
  propertyUrl,
  compact = false,
}: {
  propertyId: string;
  propertyUrl: string;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleShare(e?: MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setError(null);
    startTransition(async () => {
      const result = await generateAgentShareLink(propertyId);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      const url = new URL(`/sa/${result.shortCode}`, new URL(propertyUrl).origin);

      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleShare}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {copied ? <Check size={13} /> : <Share2 size={13} />}
          {copied ? "¡Enlace copiado!" : isPending ? "Generando..." : "Compartir"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full border-black! bg-black! text-emerald-400! hover:bg-neutral-900! hover:text-emerald-300!"
        onClick={handleShare}
        disabled={isPending}
      >
        {copied ? <Check size={18} /> : <Share2 size={18} />}
        {copied ? "¡Enlace copiado!" : "Compartir"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
