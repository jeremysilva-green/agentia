"use client";

import { useState, type MouseEvent } from "react";
import { FileImage } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FlyerDialog } from "@/components/property/FlyerDialog";

// "Flyer": the agent's button on a property card and listing page. Opens the
// flyer dialog; "Guardar" keeps the flyer in Redes Sociales. `compact` is the
// small card variant.
export function FlyerButton({
  propertyId,
  title,
  compact = false,
}: {
  propertyId: string;
  title: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // The button sits inside property cards that are links, and React events
  // bubble out of the portal as well — keep every click from reaching the card.
  function openDialog(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={openDialog}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
        >
          <FileImage size={13} />
          Flyer
        </button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={openDialog}
          className="w-full border-[#0a8f5c]! bg-[#0a8f5c]! text-white! hover:border-[#13c47f]! hover:bg-[#13c47f]!"
        >
          <FileImage size={18} />
          Flyer
        </Button>
      )}

      {open && (
        <FlyerDialog
          propertyId={propertyId}
          title={title}
          redirectTo="/panel/redes-sociales"
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
