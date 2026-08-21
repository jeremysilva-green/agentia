"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { AcuerdoPrivadoFields } from "@/components/panel/AcuerdoPrivadoFields";
import { submitOwnerAgreementByShareCode } from "@/lib/actions/privateAgreements";
import type { PrivateAgreement } from "@/types/domain";

export function OwnerAcuerdoForm({ agreement }: { agreement: PrivateAgreement }) {
  const action = submitOwnerAgreementByShareCode.bind(null, agreement.share_code);
  const [state, formAction, pending] = useActionState(action, undefined);

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-sm font-medium text-emerald-800">¡Listo! Completaste tu parte del acuerdo.</p>
        <p className="mt-1 text-xs text-emerald-700">El agente ya puede revisar y firmar su parte.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AcuerdoPrivadoFields viewerRole="owner" agreement={agreement} fieldErrors={state?.fieldErrors} />

      {state?.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Guardando..." : "Guardar y firmar"}
      </Button>
    </form>
  );
}
