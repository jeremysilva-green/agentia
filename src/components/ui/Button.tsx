import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-prussian text-white hover:bg-prussian-light hover:shadow-lg hover:shadow-prussian/30 focus-visible:outline-prussian disabled:bg-prussian/30 disabled:shadow-none",
  secondary:
    "bg-snow text-prussian border border-bone hover:bg-bone/40 hover:border-bone hover:shadow-md focus-visible:outline-slate-400 disabled:text-slate-400 disabled:shadow-none",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400",
  danger:
    "bg-clay/10 text-clay hover:bg-clay/20 hover:shadow-md hover:shadow-clay/20 focus-visible:outline-clay",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out disabled:cursor-not-allowed outline-none focus-visible:outline-2 focus-visible:outline-offset-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
