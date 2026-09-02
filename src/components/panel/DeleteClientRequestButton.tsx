"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteClientRequest } from "@/lib/actions/clientRequests";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function DeleteClientRequestButton({ requestId }: { requestId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setConfirmOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await deleteClientRequest(requestId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        aria-label="Eliminar solicitud"
        title="Eliminar solicitud"
        className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-60"
      >
        <Trash2 size={13} />
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar solicitud"
        message="¿Eliminar esta solicitud? Esta acción no se puede deshacer."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
