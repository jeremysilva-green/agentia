"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

// Mirrors the mockup's bottom sticky bar: hidden until the price card (by
// `targetId`) scrolls out of view, visible only below the `lg` breakpoint
// where the price card isn't sticky-positioned alongside the content.
export function MobileStickyBar({ priceLabel, targetId }: { priceLabel: string; targetId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting), {
      rootMargin: "-72px 0px 0px 0px",
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-white/10 bg-neutral-900/95 px-4 py-3 backdrop-blur-lg transition-transform duration-300 lg:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold tracking-wide text-white/40 uppercase">Precio</span>
        <span className="font-display block truncate text-lg font-semibold text-white">{priceLabel}</span>
      </div>
      <a
        href={`#${targetId}`}
        className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        <MessageCircle size={16} />
        Consultar
      </a>
    </div>
  );
}
