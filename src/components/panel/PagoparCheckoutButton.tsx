"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { callPagoparFunction } from "@/lib/pagoparFunctions";

export function PagoparCheckoutButton({ label }: { label: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await callPagoparFunction<{ redirectUrl: string }>("crear-pedido-pagopar");
        window.location.href = result.redirectUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button type="button" size="lg" onClick={handleClick} disabled={isPending}>
        {isPending ? "Redirigiendo..." : label}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
