"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Link2, Check, MessageCircle } from "lucide-react";
import { createOrGetCatalog } from "@/lib/actions/catalog";
import { copy } from "@/lib/copy";

export function CreateCatalogButton({ agentId, agentSlug }: { agentId: string; agentSlug: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [catalogUrl, setCatalogUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    startTransition(async () => {
      const result = await createOrGetCatalog(agentId);

      if ("error" in result) {
        if (result.code === "auth_required") {
          router.push(`/ingresar?next=${encodeURIComponent(`/agentes/${agentSlug}`)}`);
          return;
        }
        setError(result.error);
        return;
      }

      setCatalogUrl(new URL(`/c/${result.code}`, window.location.origin).toString());
    });
  }

  async function handleCopy() {
    if (!catalogUrl) return;
    await navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (catalogUrl) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <p className="text-xs font-medium text-emerald-400">{copy.catalog.linkReady}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            {copied ? <Check size={13} /> : <Link2 size={13} />}
            {copied ? copy.catalog.linkCopied : copy.catalog.copyLink}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(catalogUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
          >
            <MessageCircle size={13} />
            {copy.catalog.shareWhatsapp}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60 disabled:hover:translate-y-0"
      >
        <LayoutGrid size={13} />
        {isPending ? copy.catalog.creating : copy.catalog.createButton}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
