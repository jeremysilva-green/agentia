"use client";

import { useState } from "react";
import { CalendarClock, ArrowRight } from "lucide-react";
import { AvailabilityModal } from "@/components/panel/AvailabilityModal";
import { copy } from "@/lib/copy";
import type { AgentAvailability } from "@/types/domain";

export function AvailabilityButton({
  availability,
  variant = "primary",
  label,
}: {
  availability: AgentAvailability[];
  variant?: "primary" | "cta";
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "cta" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#13c47f44] bg-[#13c47f12] px-3.5 py-2.5 text-[13.5px] font-semibold text-[var(--em-2)] transition-colors hover:bg-[var(--em)] hover:text-white"
        >
          {label ?? copy.panel.myAvailability}
          <ArrowRight size={15} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--em)] px-4 text-sm font-semibold text-white shadow-[0_12px_34px_-12px_var(--em-glow)] transition-colors hover:bg-[var(--em-2)]"
        >
          <CalendarClock size={16} />
          {label ?? copy.panel.myAvailability}
        </button>
      )}
      {open && <AvailabilityModal availability={availability} onClose={() => setOpen(false)} />}
    </>
  );
}
