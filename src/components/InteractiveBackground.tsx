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
    let frame = 0;
    let lastEvent: MouseEvent | null = null;

    function applyPosition() {
      frame = 0;
      const el = spotRef.current;
      if (!el || !lastEvent) return;
      const rect = el.getBoundingClientRect();
      const x = ((lastEvent.clientX - rect.left) / rect.width) * 100;
      const y = ((lastEvent.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--spot-x", `${x}%`);
      el.style.setProperty("--spot-y", `${y}%`);
    }

    // Raw mousemove can fire 60-120+ times/sec — writing a style property on
    // every single one (rather than once per paint) is what caused a visible
    // flicker through semi-transparent overlays (e.g. modals) stacked above
    // this background. Coalescing to one update per animation frame fixes
    // that with no visible difference in how the glow tracks the cursor.
    function handleMove(e: MouseEvent) {
      lastEvent = e;
      if (!frame) frame = requestAnimationFrame(applyPosition);
    }

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (frame) cancelAnimationFrame(frame);
    };
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
