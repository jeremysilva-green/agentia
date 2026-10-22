"use client";

import { useState, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { toggleLike } from "@/lib/actions/propertyLikes";

function getVisitorId() {
  if (typeof window === "undefined") return "";
  const key = "agently_like_visitor";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}

// The toggle itself is instant/local (no "did I already like this" restore
// on mount — this app has no login-gated favorites list to show, just a
// lightweight engagement signal), but each click also persists to
// property_likes so it counts toward the agent's "Embudo del mes" funnel on
// Vista Global. Fire-and-forget: a failed persist doesn't roll back the UI.
export function FavoriteButton({ propertyId }: { propertyId: string }) {
  const [on, setOn] = useState(false);

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !on;
    setOn(next);
    void toggleLike(propertyId, getVisitorId(), next);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={on}
      aria-label="Guardar"
      className={cn(
        "absolute top-2 right-2 z-10 grid h-9 w-9 place-items-center rounded-xl border backdrop-blur-sm transition-colors",
        on
          ? "border-[#ff6b8166] bg-[#0e0e0ecc] text-[#ff6b81]"
          : "border-white/[0.12] bg-[#0e0e0ecc] text-white hover:border-[#ff6b81]"
      )}
    >
      <Heart size={17} className={on ? "fill-current" : undefined} />
    </button>
  );
}
