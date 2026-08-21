"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    Bancard?: {
      Cards: {
        createForm: (containerId: string, resultado: string, options: Record<string, unknown>) => void;
      };
    };
  }
}

// Direct-Bancard equivalent of PagoparCardForm (kept as-is, unused for now).
// Renders the same official Bancard card-catastro iframe, but the process_id
// ("resultado") now comes from our own /api/checkout/bancard/tarjeta route
// instead of Pagopar's agregar-tarjeta edge function.
export function BancardCardForm() {
  const [resultado, setResultado] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión expirada. Volvé a ingresar.");

      const response = await fetch("/api/checkout/bancard/tarjeta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "No se pudo iniciar el catastro de tarjeta.");
      return data.resultado as string;
    }

    init()
      .then((processId) => setResultado(processId))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo iniciar el catastro de tarjeta."));
  }, []);

  useEffect(() => {
    if (!resultado || !scriptReady || !window.Bancard) return;

    window.Bancard.Cards.createForm("iframe-container", resultado, {
      styles: {
        "input-background-color": "#ffffff",
        "input-text-color": "#333333",
        "input-border-color": "#e2e8f0",
        "input-placeholder-color": "#94a3b8",
        "button-background-color": "#059669",
        "button-text-color": "#ffffff",
        "button-border-color": "#059669",
        "form-background-color": "#ffffff",
        "form-border-color": "#e2e8f0",
        "header-background-color": "#f8fafc",
        "header-text-color": "#0f172a",
        "hr-border-color": "#e2e8f0",
      },
    });
  }, [resultado, scriptReady]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <>
      <Script src="/bancard-checkout-2.1.0.js" onLoad={() => setScriptReady(true)} />
      <div style={{ height: 180, width: "100%", margin: "auto" }} id="iframe-container">
        {!resultado && <p className="text-sm text-slate-500">Cargando formulario de tarjeta...</p>}
      </div>
    </>
  );
}
