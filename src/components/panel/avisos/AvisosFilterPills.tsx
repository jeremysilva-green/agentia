"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Building2, Users, CalendarClock, Handshake, CircleDot } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { MlsNoticeFilter } from "@/lib/data/mlsNotices";

const FILTERS: { value: MlsNoticeFilter; label: string; icon: typeof Bell }[] = [
  { value: "all", label: copy.mls.avisosFilterAll, icon: Bell },
  { value: "listings", label: copy.mls.avisosFilterListings, icon: Building2 },
  { value: "buyers", label: copy.mls.avisosFilterBuyers, icon: Users },
  { value: "showings", label: copy.mls.avisosFilterShowings, icon: CalendarClock },
  { value: "closings", label: copy.mls.avisosFilterClosings, icon: Handshake },
  { value: "no_leidos", label: copy.mls.avisosFilterUnread, icon: CircleDot },
];

export function AvisosFilterPills({ current }: { current: MlsNoticeFilter }) {
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  // Re-measure whenever the active filter changes, same measure-and-translate
  // technique as PanelNav's sliding pill.
  useLayoutEffect(() => {
    function place() {
      const list = listRef.current;
      const indicator = indicatorRef.current;
      if (!list || !indicator) return;
      const active = list.querySelector<HTMLElement>('a[data-active="true"]');
      if (!active) return;
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.transform = `translateX(${active.offsetLeft}px)`;
    }
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [current]);

  return (
    <div
      ref={listRef}
      className="relative inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] p-1.5"
    >
      <div
        ref={indicatorRef}
        className="absolute top-1.5 left-0 h-[38px] rounded-xl bg-[var(--em)] shadow-[0_10px_26px_-12px_var(--em-glow)] transition-[transform,width] duration-300"
      />
      {FILTERS.map((f) => {
        const isActive = current === f.value;
        return (
          <Link
            key={f.value}
            href={f.value === "all" ? "/panel/avisos" : `/panel/avisos?filter=${f.value}`}
            data-active={isActive}
            className={cn(
              "relative z-10 inline-flex h-[38px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
              isActive ? "text-white" : "text-[#bdbdbd] hover:text-white"
            )}
          >
            <f.icon size={16} />
            {f.label}
          </Link>
        );
      })}
    </div>
  );
}
