"use client";

import { useActionState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AcuerdoPrivadoFields } from "@/components/panel/AcuerdoPrivadoFields";
import { saveAgentAgreementFields } from "@/lib/actions/privateAgreements";
import type { PrivateAgreement } from "@/types/domain";

export function AgentAcuerdoModal({ agreement, onClose }: { agreement: PrivateAgreement; onClose: () => void }) {
  const action = saveAgentAgreementFields.bind(null, agreement.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) onClose();
    // Only meant to react to a successful save, not to identity changes of onClose across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div
        className="my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-emerald-500 bg-slate-200 shadow-xl sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-prussian px-5 py-4">
          <div>
            <span className="font-display text-lg uppercase tracking-tight text-white">AGENTIA</span>
            <p className="text-xs text-white/70">Autorización para Intermediar Venta de Inmueble</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-white/70 transition-colors hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <form action={formAction} className="flex flex-col gap-4">
            <AcuerdoPrivadoFields viewerRole="agent" agreement={agreement} fieldErrors={state?.fieldErrors} />

            {state?.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cerrar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Guardando..." : "Guardar y firmar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
