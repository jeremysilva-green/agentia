"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { callPagoparFunction } from "@/lib/pagoparFunctions";

export default function CheckoutResultadoPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = usePromise(params);
  const router = useRouter();

  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callPagoparFunction<{ resultado: Record<string, unknown> }>("consultar-estado-pedido", { hash })
      .then((data) => {
        setResultado(data.resultado);
        setState("done");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo consultar el estado del pago.");
        setState("error");
      });
  }, [hash]);

  // NOT CONFIRMED: the exact shape of `resultado` from pedidos/1.1/traer
  // wasn't in the provided docs — this reads a couple of plausible field
  // names defensively rather than assuming one exact shape.
  const paid =
    resultado &&
    (resultado.pagado === true || resultado.estado === "pagado" || resultado.estado === "Pagado");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="flex w-full flex-col items-center gap-4 rounded-[26px] border border-[var(--line)] bg-[var(--ink-2)] p-8">
        {state === "loading" && <Loader2 className="animate-spin text-[var(--muted)]" size={32} />}

        {state === "error" && (
          <>
            <XCircle className="text-[#ff7a7a]" size={40} />
            <p className="text-sm text-[#ff8a8a]">{error}</p>
          </>
        )}

        {state === "done" && paid && (
          <>
            <CheckCircle2 className="text-[var(--em-2)]" size={40} />
            <h1 className="font-display text-lg font-semibold text-white">¡Pago confirmado!</h1>
            <p className="text-sm text-[var(--muted)]">Tu suscripción está activa.</p>
          </>
        )}

        {state === "done" && !paid && (
          <>
            <XCircle className="text-amber-400" size={40} />
            <h1 className="font-display text-lg font-semibold text-white">Pago pendiente o rechazado</h1>
            <p className="text-sm text-[var(--muted)]">Si ya pagaste, esperá unos minutos y volvé a revisar.</p>
          </>
        )}

        <button
          type="button"
          onClick={() => router.push("/panel/suscripcion")}
          className="inline-flex h-10 items-center rounded-xl border border-[var(--line)] bg-white/[0.04] px-4 text-sm font-semibold text-[#d5d5d5] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
        >
          Volver a Suscripción
        </button>
      </div>
    </div>
  );
}
