import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "border-sage bg-snow text-prussian",
  warning: "border-transparent bg-amber-50 text-amber-700",
  danger: "border-transparent bg-clay/10 text-clay",
  neutral: "border-transparent bg-bone/50 text-prussian/70",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
