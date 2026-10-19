import { cn } from "@/lib/cn";

type Tone = "emerald" | "blue" | "amber" | "red" | "neutral";

const tones: Record<Tone, string> = {
  emerald: "border-[#13c47f66] bg-[#13c47f17] text-[var(--em-2)]",
  blue: "border-[#5aa9ff44] bg-[#5aa9ff17] text-[#7dbbff]",
  amber: "border-[#e3b55a44] bg-[#e3b55a17] text-[#e3b55a]",
  red: "border-[#ff5a5a44] bg-[#ff5a5a17] text-[#ff8a8a]",
  neutral: "border-white/10 bg-white/[0.08] text-[#cfcfcf]",
};

// Mirrors the mockups' `.badge`/`.fchip`/`.status`/`.tagx` pill. Panel-local —
// does not touch the shared `Badge` component used outside /panel.
export function PanelBadge({ children, className, tone = "emerald" }: { children: React.ReactNode; className?: string; tone?: Tone }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}
