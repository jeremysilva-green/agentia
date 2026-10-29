"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const PHRASES = [
  "El portal inmobiliario más inteligente de Paraguay.",
  "Agentes verificados con los mejores portafolios.",
  "Compartí tus enlaces y ganá comisiones por cada venta.",
];

export function HeroHeadline({
  fallback,
  animated,
  dark = false,
}: {
  fallback: string;
  animated: boolean;
  // Only an additive override — existing callers that don't pass it keep
  // the exact same (dark-text-on-light) look.
  dark?: boolean;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), 4000);
    return () => clearInterval(id);
  }, [animated]);

  return (
    <h1
      key={animated ? index : "static"}
      className={cn(
        "animate-fade-in-up text-balance font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-5xl lg:text-5xl xl:text-6xl",
        dark ? "text-white" : "text-prussian"
      )}
    >
      {animated ? PHRASES[index] : fallback}
    </h1>
  );
}
