"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
      <Card className="flex w-full flex-col items-center gap-4 p-8">
        {state === "loading" && <Loader2 className="animate-spin text-slate-400" size={32} />}

        {state === "error" && (
          <>
            <XCircle className="text-red-500" size={40} />
            <p className="text-sm text-red-600">{error}</p>
          </>
        )}

        {state === "done" && paid && (
          <>
            <CheckCircle2 className="text-emerald-500" size={40} />
            <h1 className="font-display text-lg font-semibold text-slate-900">¡Pago confirmado!</h1>
            <p className="text-sm text-slate-500">Tu suscripción está activa.</p>
          </>
        )}

        {state === "done" && !paid && (
          <>
            <XCircle className="text-amber-500" size={40} />
            <h1 className="font-display text-lg font-semibold text-slate-900">Pago pendiente o rechazado</h1>
            <p className="text-sm text-slate-500">Si ya pagaste, esperá unos minutos y volvé a revisar.</p>
          </>
        )}

        <Button type="button" size="sm" variant="secondary" onClick={() => router.push("/panel/suscripcion")}>
          Volver a Suscripción
        </Button>
      </Card>
    </div>
  );
}
