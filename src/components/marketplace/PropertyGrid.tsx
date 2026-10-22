"use client";

import { useState } from "react";
import { CopyToast } from "@/components/marketplace/CopyToast";

const PAGE_SIZE = 20;

// `PropertyCard` is an async Server Component (it awaits a Supabase client
// internally), so it can't be imported and invoked from here — a Client
// Component can only receive already-rendered Server Component output as
// children/props, never call one itself. The parent server page renders the
// <PropertyCard> elements and hands them down as `cards`; this component
// only owns the pagination slicing.
export function PropertyGrid({ cards, emptyMessage }: { cards: React.ReactNode[]; emptyMessage: string }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (cards.length === 0) {
    return (
      <p className="w-full rounded-2xl border border-dashed border-[#2f2f2f] bg-[var(--ink-2)] p-10 text-center text-sm text-[var(--muted)]">
        {emptyMessage}
      </p>
    );
  }

  const visibleCards = cards.slice(0, visibleCount);
  const hasMore = visibleCount < cards.length;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{visibleCards}</div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          className="rounded-xl bg-[var(--em)] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_var(--em-glow)] transition-colors hover:bg-[var(--em-2)]"
        >
          Cargar más
        </button>
      )}

      <CopyToast />
    </div>
  );
}
