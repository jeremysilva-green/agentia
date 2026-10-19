"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAgentSocialShare } from "@/lib/actions/agentSocialShares";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function DeleteAgentSocialShareButton({ shareId }: { shareId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setConfirmOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await deleteAgentSocialShare(shareId);
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
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff5a5a33] bg-[#ff5a5a0d] text-[#ff7a7a] transition-colors hover:border-[#ff5a5a] hover:bg-[#ff5a5a] hover:text-white disabled:opacity-60"
      >
        <Trash2 size={13} />
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar enlace"
        message="¿Eliminar este enlace? Ya no vas a poder rastrear nuevas visitas con él."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
