"use client";

import { useState, useTransition } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cancelSubscription } from "@/lib/actions/subscription";

export function CancelSubscriptionButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    if (
      !confirm(
        "¿Cancelar tu suscripción? Se detienen los cobros automáticos de inmediato y tu portafolio deja de estar visible públicamente. Guardamos tus datos de pago por si querés volver a suscribirte más adelante."
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await cancelSubscription();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button type="button" variant="danger" size="sm" onClick={handleCancel} disabled={isPending}>
        <XCircle size={15} />
        {isPending ? "Cancelando..." : "Cancelar suscripción"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
