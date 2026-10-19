"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="group inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--em)] px-4.5 text-[14.5px] font-semibold text-white shadow-[0_12px_34px_-12px_var(--em-glow)] transition-colors hover:bg-[var(--em-2)] disabled:opacity-60"
      >
        <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
        {isPending ? "Generando..." : "Acuerdo Privado"}
      </button>
      {error && <p className="text-xs text-[#ff8a8a]">{error}</p>}
    </div>
  );
}
