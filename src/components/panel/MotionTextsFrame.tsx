"use client";

import { useEffect, useRef, useState } from "react";
import { UpgradeModal } from "@/components/panel/UpgradeModal";

// Hosts the standalone Textos Dinámicos tool (public/textos-dinamicos) and
// answers its "start" / "failed" messages — the tool itself is static and
// runs in the browser, so plan/trial enforcement happens here + in the API.
export function MotionTextsFrame({
  isFree,
  triesRemaining: initialTries,
  triesTotal,
  fundadorSeatsRemaining,
}: {
  isFree: boolean;
  triesRemaining: number;
  triesTotal: number;
  fundadorSeatsRemaining?: number;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [tries, setTries] = useState(initialTries);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      const { source, type, id } = e.data ?? {};
      if (source !== "mt" || (type !== "start" && type !== "failed")) return;

      const reply = (payload: object) => frameRef.current?.contentWindow?.postMessage({ id, ...payload }, window.location.origin);

      try {
        const res = await fetch("/api/motion-texts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: type }),
        });
        const data = await res.json().catch(() => ({}));
        if (typeof data.remaining === "number") setTries(data.remaining);
        if (data.code === "free_limit") {
          setTries(0);
          setShowUpgrade(true);
        }
        reply(res.ok ? { ok: true } : { ok: false, error: data.error ?? "No se pudo verificar tu plan." });
      } catch {
        reply({ ok: false, error: "No pude conectarme. Probá de nuevo." });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {isFree && (
        <p className="text-sm text-slate-400">
          {tries > 0
            ? `Prueba gratis: te quedan ${tries} de ${triesTotal} videos. Con Pro, Fundador o MLS es ilimitado.`
            : "Usaste tus videos gratis. Actualizá tu plan para seguir."}
        </p>
      )}
      <iframe
        ref={frameRef}
        src="/textos-dinamicos/index.html"
        title="Textos Dinámicos"
        allow="autoplay; fullscreen"
        className="h-[1250px] w-full rounded-[20px] border-0 bg-[#0e0e0e]"
      />
      <UpgradeModal
        reason="motion"
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        fundadorSeatsRemaining={fundadorSeatsRemaining}
      />
    </div>
  );
}
