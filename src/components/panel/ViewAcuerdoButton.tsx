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
  const label = agreement.status === "completed" ? "Ver Acuerdo" : "Completar Acuerdo";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-white/5 px-2 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10"
      >
        <FileSignature size={11} />
        {label}
      </button>
      {open && <AgentAcuerdoModal agreement={agreement} onClose={() => setOpen(false)} />}
    </>
  );
}
