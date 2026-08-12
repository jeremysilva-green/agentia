import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-bone bg-snow shadow-sm shadow-prussian/5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-prussian/10",
        className
      )}
      {...props}
    />
  );
}
