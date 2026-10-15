"use client";

import { cn } from "@/lib/cn";

// Generalizes the inline currency-toggle markup originally in PropertyForm —
// a small segmented control for 2-4 mutually exclusive options.
export function PillTabs({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg border border-slate-200 p-0.5 text-xs font-medium",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded px-2.5 py-1 transition-colors",
            value === option.value ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
