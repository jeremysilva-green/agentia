"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { deleteAgreement } from "@/lib/actions/privateAgreements";

export function DeleteAcuerdoButton({ agreementId }: { agreementId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setConfirmOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await deleteAgreement(agreementId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        aria-label="Eliminar acuerdo"
        title="Eliminar acuerdo"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#ff5a5a33] bg-[#ff5a5a0d] text-[#ff7a7a] transition-colors hover:border-[#ff5a5a] hover:bg-[#ff5a5a] hover:text-white disabled:opacity-60"
      >
        <Trash2 size={13} />
      </button>
      {error && <p className="text-[11px] text-red-400">{error}</p>}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#ff5a5a44] bg-[var(--ink-2)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-white">Eliminar Acuerdo Privado</h2>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="shrink-0 text-[var(--muted)] transition-colors hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[#cfcfcf]">¿Eliminar este Acuerdo Privado? Esta acción no se puede deshacer.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-medium text-[#d5d5d5] transition-colors hover:border-[#4a4a4a] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-[#ff5a5a] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#ff6b6b]"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
