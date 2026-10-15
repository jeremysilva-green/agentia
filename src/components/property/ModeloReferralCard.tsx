"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Link2, Check } from "lucide-react";
import { generateAffiliateLink } from "@/lib/actions/affiliate";

// Per mockup C's referral-program card: Modelo listings have no public
// price to compute "1% of X" from, so the reward shown here is always the
// fixed amount the agent configured — never a percentage. Reuses
// generateAffiliateLink (the same action GenerateLinkButton calls) rather
// than inventing a separate link mechanism.
export function ModeloReferralCard({
  propertyId,
  propertyPath,
  rewardAmountLabel,
  triggerLabel,
}: {
  propertyId: string;
  propertyPath: string;
  rewardAmountLabel: string;
  triggerLabel: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await generateAffiliateLink(propertyId);

      if ("error" in result) {
        if (result.code === "auth_required") {
          router.push(`/ingresar?next=${encodeURIComponent(propertyPath)}`);
          return;
        }
        setError(result.error);
        return;
      }

      const url = new URL(`/s/${result.shortCode}`, window.location.origin);
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <p className="text-sm font-semibold text-emerald-900">¿Conocés a alguien que quiere construir su casa?</p>
      <p className="text-sm text-emerald-800">
        Compartí tu link. Si {triggerLabel ? triggerLabel.toLowerCase() : "se concreta el contrato"} con alguien que
        llegó por tu link, ganás {rewardAmountLabel}.
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="mt-1 inline-flex items-center justify-center gap-2 self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
        {copied ? "¡Link copiado!" : isPending ? "Generando..." : "Copiar mi link de referido"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
