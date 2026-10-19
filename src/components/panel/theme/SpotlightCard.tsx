"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

// Mouse-tracked radial-gradient hover glow, matching the mockups' spotlight
// cards (KPI tiles, empty states, list rows). Paired with the `.panel-spotlight`
// CSS in panel-theme.css.
export function SpotlightCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div ref={ref} onPointerMove={handleMove} className={cn("panel-spotlight", className)} {...props}>
      {children}
    </div>
  );
}
