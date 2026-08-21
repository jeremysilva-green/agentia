"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileSignature } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createAgentAgreement } from "@/lib/actions/privateAgreements";

export function NewAcuerdoButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await createAgentAgreement();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/panel/acuerdos?open=${result.agreement.id}`);
    });
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={handleClick} disabled={isPending}>
        <FileSignature size={16} />
        {isPending ? "Generando..." : "Acuerdo Privado"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </>
  );
}
