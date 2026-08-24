"use client";

import { useState, useTransition } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { generateAgentShareLink } from "@/lib/actions/agentSocialShares";

export function AgentShareButton({ propertyId, propertyUrl }: { propertyId: string; propertyUrl: string }) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleShare() {
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

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full hover:bg-emerald-600! hover:text-white! hover:border-emerald-600!"
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
