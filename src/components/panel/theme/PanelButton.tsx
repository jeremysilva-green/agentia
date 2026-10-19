import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost";

const base =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-all duration-300";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--em)] text-white shadow-[0_12px_34px_-12px_var(--em-glow)] hover:bg-[var(--em-2)] hover:-translate-y-0.5",
  outline: "border border-[var(--line)] bg-white/[0.04] text-[#d5d5d5] hover:border-[var(--em)] hover:text-[var(--em-2)]",
  ghost: "border border-[var(--line)] text-[#cfcfcf] hover:border-[#4a4a4a] hover:text-white",
};

type CommonProps = { children: React.ReactNode; variant?: Variant; className?: string };

// Mirrors the mockups' `.btn-new`/`.btn.pri` (primary), `.ab`/`.ghost`
// (outline/ghost). Panel-local — does not touch the shared `Button`
// component used outside /panel (checkout flows, auth forms, etc.).
export function PanelButton({
  children,
  variant = "primary",
  className,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function PanelLinkButton({
  children,
  variant = "primary",
  className,
  href,
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
