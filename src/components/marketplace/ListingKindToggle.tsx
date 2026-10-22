"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Users, Building2 } from "lucide-react";
import { cn } from "@/lib/cn";

type View = "agentes" | "propiedades";

// Same measure-and-translate sliding-indicator technique already used by
// PanelNav and AvisosFilterPills elsewhere in this app — the pill's
// position/width come from the active tab's real offsetLeft/offsetWidth,
// not a hardcoded guess. URL-param driven (not client state), same pattern
// as FilterBar, so the view is shareable/bookmarkable.
export function ListingKindToggle({
  current,
  labels,
  counts,
}: {
  current: View;
  labels: { agents: string; properties: string };
  counts: { agents: number; properties: number };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    function place() {
      const list = listRef.current;
      const indicator = indicatorRef.current;
      if (!list || !indicator) return;
      const active = list.querySelector<HTMLElement>('button[data-active="true"]');
      if (!active) return;
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.transform = `translateX(${active.offsetLeft}px)`;
    }
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [current]);

  function setView(view: View) {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "agentes") params.delete("view");
    else params.set("view", view);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const tabs: { value: View; label: string; icon: typeof Users; count: number }[] = [
    { value: "agentes", label: labels.agents, icon: Users, count: counts.agents },
    { value: "propiedades", label: labels.properties, icon: Building2, count: counts.properties },
  ];

  return (
    <nav ref={listRef} className="relative inline-flex gap-1 rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] p-1.5">
      <div
        ref={indicatorRef}
        className="absolute top-1.5 left-0 h-10 rounded-xl bg-[var(--em)] shadow-[0_10px_26px_-12px_var(--em-glow)] transition-[transform,width] duration-450"
        style={{ transitionTimingFunction: "cubic-bezier(.3,1.3,.5,1)" }}
      />
      {tabs.map((tab) => {
        const isActive = current === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            data-active={isActive}
            onClick={() => setView(tab.value)}
            className={cn(
              "relative z-10 inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition-colors",
              isActive ? "text-white" : "text-[#bdbdbd] hover:text-white"
            )}
          >
            <tab.icon size={17} />
            {tab.label}
            <span
              className={cn(
                "grid h-[22px] min-w-[22px] place-items-center rounded-full px-1.5 text-xs transition-colors",
                isActive ? "bg-white/[0.18]" : "bg-white/[0.08]"
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
