"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UpgradeModal } from "@/components/panel/UpgradeModal";

// Shown to agents without a paid plan in place of MarketingVideoGenerator —
// same look, plus a "Pro" badge; clicking opens the upgrade modal.
export function LockedVideoButton({ fundadorSeatsRemaining }: { fundadorSeatsRemaining: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full border-black! bg-black! text-white! hover:bg-neutral-800!"
      >
        <Video size={14} />
        Generar video
        <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white">Pro</span>
      </Button>
      <UpgradeModal reason="video" open={open} onClose={() => setOpen(false)} fundadorSeatsRemaining={fundadorSeatsRemaining} />
    </>
  );
}
