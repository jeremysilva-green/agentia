"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

// Mirrors the mockups' IntersectionObserver-driven `.rv`/`.rv.in` scroll
// reveal. One observer per instance is fine at this scale (a panel page
// never renders more than a few dozen of these).
export function Reveal({
  children,
  delay,
  className,
}: {
  children: React.ReactNode;
  delay?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("panel-reveal", visible && "panel-reveal-in", delay && `panel-reveal-d${delay}`, className)}
    >
      {children}
    </div>
  );
}
