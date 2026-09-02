"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAffiliateLink } from "@/lib/actions/affiliate";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function DeleteAffiliateLinkButton({ linkId }: { linkId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setConfirmOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await deleteAffiliateLink(linkId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        aria-label="Eliminar enlace"
        className="inline-flex items-center justify-center rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        <Trash2 size={13} />
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar enlace"
        message="¿Eliminar este enlace? Ya no vas a poder rastrear nuevas visitas ni ventas con él."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
