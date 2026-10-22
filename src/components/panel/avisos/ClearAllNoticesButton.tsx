"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { deleteAllMlsNotices } from "@/lib/actions/mlsNotices";

export function ClearAllNoticesButton() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setConfirmOpen(false);
    startTransition(async () => {
      await deleteAllMlsNotices();
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white/[0.04] px-3.5 text-[13px] font-semibold text-[#d5d5d5] transition-colors hover:border-[#ff5a5a] hover:text-[#ff7a7a] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 size={14} />
        {isPending ? "Borrando..." : "Vaciar todo"}
      </button>

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
              <h2 className="text-base font-semibold text-white">Vaciar todos los avisos</h2>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="shrink-0 text-[var(--muted)] transition-colors hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[#cfcfcf]">
              ¿Eliminar todos tus avisos? Esta acción no se puede deshacer.
            </p>
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
                Vaciar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
