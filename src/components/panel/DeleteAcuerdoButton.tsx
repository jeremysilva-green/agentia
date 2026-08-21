"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAgreement } from "@/lib/actions/privateAgreements";

export function DeleteAcuerdoButton({ agreementId }: { agreementId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("¿Eliminar este Acuerdo Privado? Esta acción no se puede deshacer.")) return;
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
        onClick={handleClick}
        disabled={isPending}
        aria-label="Eliminar acuerdo"
        title="Eliminar acuerdo"
        className="inline-flex items-center justify-center rounded-md border border-red-500/30 bg-white/5 p-1.5 text-red-400 hover:bg-red-500/10 disabled:opacity-60"
      >
        <Trash2 size={13} />
      </button>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
