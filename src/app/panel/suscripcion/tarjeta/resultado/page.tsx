"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { callPagoparFunction } from "@/lib/pagoparFunctions";

type ConfirmResult = {
  ok: boolean;
  tarjetaGuardada: boolean;
  charged?: { success: boolean; error?: string } | null;
};

function TarjetaResultadoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status");
  const description = searchParams.get("description");

  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callPagoparFunction<ConfirmResult>("pagopar-confirmar-tarjeta", {
      status: status ?? undefined,
      returnUrl: typeof window !== "undefined" ? `${window.location.origin}/panel/suscripcion/tarjeta/resultado` : undefined,
    })
      .then((data) => {
        setResult(data);
        setState("done");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo confirmar el catastro de la tarjeta.");
        setState("error");
      });
    // Confirmar-tarjeta is mandatory exactly once per redirect back — no deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardSuccess = status === "add_new_card_success";

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

        {state === "done" && cardSuccess && (
          <>
            <CheckCircle2 className="text-emerald-500" size={40} />
            <h1 className="font-display text-lg font-semibold text-slate-900">¡Tarjeta guardada!</h1>
            {result?.charged?.success && (
              <p className="text-sm text-slate-500">Tu suscripción se activó automáticamente.</p>
            )}
            {result?.charged && !result.charged.success && (
              <p className="text-sm text-amber-600">
                Guardamos tu tarjeta, pero el primer cobro no pasó: {result.charged.error}
              </p>
            )}
          </>
        )}

        {state === "done" && !cardSuccess && (
          <>
            <XCircle className="text-red-500" size={40} />
            <h1 className="font-display text-lg font-semibold text-slate-900">No se pudo guardar la tarjeta</h1>
            {description && <p className="text-sm text-slate-500">{decodeURIComponent(description)}</p>}
          </>
        )}

        <Button type="button" size="sm" variant="secondary" onClick={() => router.push("/panel/suscripcion")}>
          Volver a Suscripción
        </Button>
      </Card>
    </div>
  );
}

export default function TarjetaResultadoPage() {
  return (
    <Suspense fallback={null}>
      <TarjetaResultadoContent />
    </Suspense>
  );
}
