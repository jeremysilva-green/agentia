"use client";

import { useEffect, useRef } from "react";

export function InteractiveBackground({
  dotColor = "rgb(18 16 14 / 0.16)",
  spotColor = "rgb(201 169 110 / 0.9)",
}: {
  dotColor?: string;
  spotColor?: string;
}) {
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const el = spotRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--spot-x", `${x}%`);
      el.style.setProperty("--spot-y", `${y}%`);
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`,
          backgroundSize: "22px 22px",
        }}
      />
      <div
        ref={spotRef}
        className="absolute inset-0 transition-[mask-position] duration-150 ease-out"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${spotColor} 2.5px, transparent 0)`,
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(220px circle at var(--spot-x, 50%) var(--spot-y, 0%), black 0%, black 40%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(220px circle at var(--spot-x, 50%) var(--spot-y, 0%), black 0%, black 40%, transparent 75%)",
        }}
      />
    </div>
  );
}
