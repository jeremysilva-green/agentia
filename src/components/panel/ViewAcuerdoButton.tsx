"use client";

import { useState } from "react";
import { FileSignature } from "lucide-react";
import { AgentAcuerdoModal } from "@/components/panel/AgentAcuerdoModal";
import type { PrivateAgreement } from "@/types/domain";

export function ViewAcuerdoButton({
  agreement,
  open: controlledOpen,
  onOpenChange,
}: {
  agreement: PrivateAgreement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) onOpenChange?.(value);
    else setUncontrolledOpen(value);
  };
  const completed = agreement.status === "completed";
  const label = completed ? "Ver Acuerdo" : "Completar Acuerdo";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          completed
            ? "inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white/[0.04] px-3.5 text-[13.5px] font-semibold whitespace-nowrap text-[#d5d5d5] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
            : "inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--em)] px-3.5 text-[13.5px] font-semibold whitespace-nowrap text-white shadow-[0_10px_26px_-12px_var(--em-glow)] transition-colors hover:bg-[var(--em-2)]"
        }
      >
        <FileSignature size={14} />
        {label}
      </button>
      {open && <AgentAcuerdoModal agreement={agreement} onClose={() => setOpen(false)} />}
    </>
  );
}
