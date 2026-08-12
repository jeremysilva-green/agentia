"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "La plataforma de ventas más inteligente del Paraguay.",
  "Agentes verificados con los mejores portafolios.",
  "Compartí tus enlaces de afiliado y ganá 1% de cada venta.",
];

export function HeroHeadline({ fallback, animated }: { fallback: string; animated: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), 4000);
    return () => clearInterval(id);
  }, [animated]);

  return (
    <h1
      key={animated ? index : "static"}
      className="animate-fade-in-up text-balance font-display text-4xl font-semibold leading-[0.95] tracking-tight text-prussian sm:text-5xl lg:text-5xl xl:text-6xl"
    >
      {animated ? PHRASES[index] : fallback}
    </h1>
  );
}
