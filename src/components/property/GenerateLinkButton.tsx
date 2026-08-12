"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Link2, Check } from "lucide-react";
import { generateAffiliateLink } from "@/lib/actions/affiliate";

export function GenerateLinkButton({ propertyId, propertyPath }: { propertyId: string; propertyPath: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {copied ? <Check size={13} /> : <Link2 size={13} />}
        {copied ? "¡Enlace copiado!" : isPending ? "Generando..." : "Generar link"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
