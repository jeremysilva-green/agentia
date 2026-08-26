"use client";

import { useEffect, useState, useTransition } from "react";
import { FileSignature } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  getCommissionAgreementPreview,
  acceptCommissionAgreement,
  type CommissionAgreementPreview,
} from "@/lib/actions/leads";

// Mandatory step between "Trato cerrado" and "Pagar al Afiliado" — the agent
// must read and accept the commission-recognition contract before payment
// becomes available. Deliberately has no close/X/backdrop-dismiss: it stays
// open until acceptCommissionAgreement succeeds, at which point the parent
// page's revalidatePath causes this row to re-render without the modal.
export function CommissionAgreementModal({ leadId }: { leadId: string }) {
  const [preview, setPreview] = useState<CommissionAgreementPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadPreview() {
    setLoadError(null);
    startTransition(async () => {
      const result = await getCommissionAgreementPreview(leadId);
      if ("error" in result) {
        setLoadError(result.error);
        return;
      }
      setPreview(result);
    });
  }

  useEffect(() => {
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  function handleAccept() {
    setAcceptError(null);
    startTransition(async () => {
      const result = await acceptCommissionAgreement(leadId);
      if ("error" in result) setAcceptError(result.error);
      // On success, the parent's revalidatePath re-renders this row without
      // commission_agreement_accepted_at unset, so the modal stops rendering
      // on its own — no local "close" state needed.
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
          <FileSignature size={18} className="text-emerald-600" />
          <h2 className="text-base font-semibold text-slate-900">Acuerdo de reconocimiento y pago de comisión</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loadError && (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-red-600">{loadError}</p>
              <Button type="button" size="sm" variant="secondary" onClick={loadPreview} disabled={isPending}>
                Reintentar
              </Button>
            </div>
          )}

          {!preview && !loadError && <p className="text-sm text-slate-500">Cargando acuerdo...</p>}

          {preview && (
            <div className="flex flex-col gap-4 text-sm leading-relaxed text-slate-700">
              <h3 className="text-center text-base font-semibold text-slate-900">
                ACUERDO DE RECONOCIMIENTO Y PAGO DE COMISIÓN POR REFERENCIA
              </h3>

              <p>
                Entre <strong>{preview.agentName}</strong>, con C.I./RUC N.º <strong>{preview.agentCiOrRuc}</strong>,
                en adelante <strong>EL AGENTE</strong>, y <strong>{preview.affiliateName}</strong>, con C.I. N.º{" "}
                <strong>{preview.affiliateCi}</strong>, en adelante <strong>EL AFILIADO</strong>, se celebra el
                presente acuerdo respecto de la operación inmobiliaria indicada a continuación.
              </p>

              <div className="rounded-xl bg-slate-50 p-3 text-xs">
                <p>
                  <strong>Propiedad:</strong> {preview.propertyLabel}
                </p>
                <p>
                  <strong>Valor de la operación:</strong> {preview.saleValueLabel}
                </p>
                <p className="break-all">
                  <strong>Link de referencia del Afiliado:</strong> {preview.referralLink}
                </p>
                <p>
                  <strong>Fecha de la operación:</strong> {preview.operationDate}
                </p>
              </div>

              <div>
                <h4 className="mb-1 font-semibold text-emerald-700">1. Reconocimiento de la referencia</h4>
                <p>
                  EL AGENTE reconoce que EL AFILIADO participó en la promoción y/o referencia de la propiedad
                  mediante el enlace único indicado anteriormente y que dicha referencia está vinculada a la
                  presente operación.
                </p>
              </div>

              <div>
                <h4 className="mb-1 font-semibold text-emerald-700">2. Comisión</h4>
                <p>
                  Por la operación concretada, EL AGENTE reconoce a favor de EL AFILIADO una comisión equivalente al{" "}
                  <strong>{preview.commissionPct}%</strong> del valor total de la compraventa, correspondiente a{" "}
                  <strong>{preview.commissionAmountLabel}</strong>.
                </p>
                <p className="mt-1">
                  EL AGENTE se compromete a efectuar el pago de dicha comisión dentro de un plazo razonable contado
                  desde la formalización de la compraventa.
                </p>
              </div>

              <div>
                <h4 className="mb-1 font-semibold text-emerald-700">3. Obligación de pago</h4>
                <p>
                  La obligación de pago establecida en este documento corresponde exclusivamente a EL AGENTE. La
                  plataforma AGENTIA actúa únicamente como herramienta tecnológica de registro y vinculación entre
                  las partes y no garantiza, adelanta ni asume el pago de esta comisión.
                </p>
              </div>

              <div>
                <h4 className="mb-1 font-semibold text-emerald-700">4. Incumplimiento</h4>
                <p>
                  El incumplimiento injustificado de la obligación de pago facultará a EL AFILIADO a reclamar el
                  monto adeudado por las vías legales correspondientes, incluyendo, cuando corresponda, los daños y
                  perjuicios derivados del incumplimiento. Asimismo, el incumplimiento podrá dar lugar a la
                  suspensión o cancelación de la cuenta de EL AGENTE dentro de AGENTIA, conforme a sus Términos y
                  Condiciones.
                </p>
              </div>

              <div>
                <h4 className="mb-1 font-semibold text-emerald-700">5. Aceptación</h4>
                <p>
                  Las partes declaran que la información consignada es verdadera y que EL AGENTE acepta las
                  obligaciones establecidas en el presente acuerdo. Al hacer clic en &quot;Acepto&quot;, este acuerdo
                  queda formalizado digitalmente y una copia en PDF se envía al panel del afiliado.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          {acceptError && <p className="mb-2 text-sm text-red-600">{acceptError}</p>}
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!preview || isPending}
            onClick={handleAccept}
          >
            {isPending ? "Procesando..." : "Acepto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
