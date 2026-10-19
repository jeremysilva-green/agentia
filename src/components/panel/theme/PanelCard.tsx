import { cn } from "@/lib/cn";

// Mirrors the mockups' `.doc`/`.kpi`/`.card`/`.pp` box look. Panel-local —
// does not touch the shared `Card` component used outside /panel.
export function PanelCard({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-[var(--line)] bg-[var(--ink-2)] p-5",
        hover && "transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#0a8f5c88]",
        className
      )}
    >
      {children}
    </div>
  );
}
