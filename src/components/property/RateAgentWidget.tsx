"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { rateAgent } from "@/lib/actions/ratings";
import { cn } from "@/lib/cn";

function getVisitorId() {
  if (typeof window === "undefined") return "";
  const key = "agently_rating_visitor";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}

export function RateAgentWidget({
  agentId,
  agentSlug,
  myRating,
}: {
  agentId: string;
  agentSlug: string;
  myRating: number | null;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [rating, setRating] = useState(myRating);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleClick(value: number) {
    setError(null);
    startTransition(async () => {
      const result = await rateAgent(agentId, agentSlug, value, getVisitorId());
      if (result.error) {
        setError(result.error);
        return;
      }
      setRating(value);
      setDone(true);
    });
  }

  const displayValue = hovered ?? rating ?? 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={isPending}
            onMouseEnter={() => setHovered(star)}
            onClick={() => handleClick(star)}
            className="disabled:cursor-not-allowed"
          >
            <Star
              size={22}
              className={cn(
                star <= displayValue ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
              )}
            />
          </button>
        ))}
      </div>
      {done && <p className="text-xs text-sage-dark">¡Gracias por tu calificación!</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
