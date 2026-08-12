import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

export function StarRating({
  value,
  count,
  newLabel,
  size = 14,
  className,
}: {
  value: number;
  count?: number;
  newLabel?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-slate-500">{count > 0 ? `(${count})` : newLabel}</span>
      )}
    </div>
  );
}
