"use client";

import { useEffect, useRef, useState } from "react";

// Mirrors the mockups' `data-count` cubic-ease count-up, started once the
// element scrolls into view (not on mount) and respecting reduced-motion.
export function CountUp({ value, prefix = "", durationMs = 1300 }: { value: number; prefix?: string; durationMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.unobserve(el);
        if (reduce) {
          setDisplay(value);
          return;
        }
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / durationMs, 1);
          setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display.toLocaleString("es-PY")}
    </span>
  );
}
