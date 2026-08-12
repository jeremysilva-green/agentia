"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { AgentTermsContent } from "./AgentTermsContent";
import { AffiliateTermsContent } from "./AffiliateTermsContent";
import { acceptTerms } from "@/lib/actions/terms";

const ACCEPT_LABEL: Record<"agent" | "affiliate", string> = {
  agent: "Acepto los Términos y Condiciones para Agentes.",
  affiliate: "Acepto los Términos y Condiciones para Afiliados.",
};

export function TermsModal({ role }: { role: "agent" | "affiliate" }) {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const date = new Date().toLocaleDateString("es-PY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptTerms();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div className="my-8 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:my-0 sm:p-6">
        {role === "agent" ? <AgentTermsContent date={date} /> : <AffiliateTermsContent date={date} />}

        <label className="mt-5 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-bone text-prussian focus-visible:outline-prussian"
          />
          <span>{ACCEPT_LABEL[role]}</span>
        </label>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <Button
          type="button"
          size="md"
          className="mt-4 w-full"
          disabled={!checked || pending}
          onClick={handleAccept}
        >
          {pending ? "Guardando..." : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
