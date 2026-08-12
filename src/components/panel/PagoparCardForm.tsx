"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { callPagoparFunction } from "@/lib/pagoparFunctions";

declare global {
  interface Window {
    Bancard?: {
      Cards: {
        createForm: (containerId: string, resultado: string, options: Record<string, unknown>) => void;
      };
    };
  }
}

// Renders Bancard's card-catastro iframe. Requires bancard-checkout-2.1.0.js
// (downloaded from Bancard's official library, per the docs — not
// redistributable here) to be placed at /public/bancard-checkout-2.1.0.js.
export function PagoparCardForm() {
  const [resultado, setResultado] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callPagoparFunction<{ resultado: string }>("pagopar-agregar-tarjeta", { proveedor: "Bancard" })
      .then((data) => setResultado(data.resultado))
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
