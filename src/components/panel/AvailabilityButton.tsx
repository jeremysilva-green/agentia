"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AvailabilityModal } from "@/components/panel/AvailabilityModal";
import { copy } from "@/lib/copy";
import type { AgentAvailability } from "@/types/domain";

export function AvailabilityButton({ availability }: { availability: AgentAvailability[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={() => setOpen(true)}
        className="border-emerald-600! bg-emerald-600! text-white! hover:bg-emerald-700!"
      >
        <CalendarClock size={16} />
        {copy.panel.myAvailability}
      </Button>
      {open && <AvailabilityModal availability={availability} onClose={() => setOpen(false)} />}
    </>
  );
}
