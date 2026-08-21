"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { isPlanId } from "@/lib/plans";

// Direct-Bancard equivalent of PagoparCheckoutButton (kept as-is, unused for
// now). Used for the "pay now" retry path when a subscription is
// past_due/pending — charges whatever plan is currently on the subscription.
export function BancardCheckoutButton({ label, plan }: { label: string; plan: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!isPlanId(plan) || plan === "basico") return;
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/checkout/bancard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "No se pudo iniciar el pago.");
        window.location.href = data.redirectUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
      }
    });
  }

  const disabled = !isPlanId(plan) || plan === "basico";

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button type="button" size="lg" onClick={handleClick} disabled={isPending || disabled}>
        {isPending ? "Redirigiendo..." : label}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
