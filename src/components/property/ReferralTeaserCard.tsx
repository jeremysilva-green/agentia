"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Link2, Check } from "lucide-react";
import { generateAffiliateLink } from "@/lib/actions/affiliate";

// Generic counterpart to ModeloReferralCard, for standard/proyecto_en_pozo
// listings — those have a real public price, so the reward is a percentage
// of the sale  rather than a fixed amount (set per listing by the agent). Reuses the same
// generateAffiliateLink action and auth_required → /ingresar redirect.
export function ReferralTeaserCard({
  propertyId,
  propertyPath,
  rewardPct,
}: {
  propertyId: string;
  propertyPath: string;
  // The affiliate's reward as a % of the sale price — set per listing.
  rewardPct: number;
}) {
  const rewardLabel = `${rewardPct.toLocaleString("es-PY", { maximumFractionDigits: 2 })}%`;
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
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-700 to-emerald-950 p-5 text-white">
      <div className="flex items-center justify-between">
        <span className="font-display text-3xl font-semibold">{rewardLabel}</span>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase">
          Afiliados
        </span>
      </div>
      <p className="mt-3 text-base font-semibold">¿Conocés a alguien interesado?</p>
      <p className="mt-1.5 text-sm text-emerald-100">
        Compartí esta propiedad con tu link de afiliado y ganá el {rewardLabel} del precio si se vende.
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 disabled:opacity-60"
      >
        {copied ? <Check size={16} /> : <Link2 size={16} />}
        {copied ? "¡Link copiado!" : isPending ? "Generando..." : "Obtener mi link"}
      </button>
      {error && <p className="mt-2 text-xs text-red-200">{error}</p>}
    </div>
  );
}
