"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Unlike the old Pagopar flow, confirmation happens server-side via
// /api/webhooks/bancard (which stores the alias token and, if the
// subscription is past_due, charges it immediately) — this page just
// reflects Bancard's redirect status back to the user, it doesn't drive
// the confirmation itself.
function TarjetaResultadoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status");
  const description = searchParams.get("description");

  const cardSuccess = status === "add_new_card_success";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <Card className="flex w-full flex-col items-center gap-4 p-8">
        {cardSuccess ? (
          <>
            <CheckCircle2 className="text-emerald-500" size={40} />
            <h1 className="font-display text-lg font-semibold text-slate-900">¡Tarjeta guardada!</h1>
            <p className="text-sm text-slate-500">
              La usaremos automáticamente para tu próxima renovación. Si tenías un pago pendiente, puede tardar unos
              instantes en procesarse.
            </p>
          </>
        ) : (
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
