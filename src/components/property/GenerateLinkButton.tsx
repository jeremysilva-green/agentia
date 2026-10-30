"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Link2, Check } from "lucide-react";
import { generateAffiliateLink } from "@/lib/actions/affiliate";
import { FlyerDialog } from "@/components/property/FlyerDialog";

// Fired on a successful copy when `dark` is set, so the page-level
// <CopyToast/> (mounted once, far away in the component tree) can react —
// this component sits inside an async Server Component (PropertyCard), so a
// callback prop can't cross that boundary; a window event can.
export const LINK_COPIED_EVENT = "market:link-copied";

export function GenerateLinkButton({
  propertyId,
  propertyPath,
  title,
  badge,
  dark = false,
}: {
  propertyId: string;
  propertyPath: string;
  // Listing title, used by the flyer dialog that opens after the link is made.
  title: string;
  // Only rendered when provided (e.g. "1%" / "Gs. 500.000") — existing
  // callers that don't pass it get the exact same button as before.
  badge?: string;
  dark?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flyerOpen, setFlyerOpen] = useState(false);

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
      if (dark) window.dispatchEvent(new Event(LINK_COPIED_EVENT));
      setTimeout(() => setCopied(false), 2500);
      // The link is made and copied; the same click offers the flyer for it.
      setFlyerOpen(true);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={
          dark
            ? "inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--em)] py-2.5 pr-3 pl-3.5 text-[13px] font-semibold text-white shadow-[0_10px_24px_-12px_var(--em-glow)] transition-colors hover:bg-[var(--em-2)] disabled:opacity-60"
            : "inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60 disabled:hover:translate-y-0"
        }
      >
        {copied ? <Check size={13} /> : <Link2 size={13} />}
        {copied ? "¡Enlace copiado!" : isPending ? "Generando..." : "Generar link"}
        {badge && !copied && (
          <em className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10.5px] font-extrabold not-italic">{badge}</em>
        )}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {flyerOpen && (
        <FlyerDialog
          propertyId={propertyId}
          title={title}
          redirectTo="/panel-afiliado/enlaces"
          // Affiliates have no logo of their own: the flyer starts without one.
          defaultNoLogo
          onClose={() => setFlyerOpen(false)}
        />
      )}
    </div>
  );
}
