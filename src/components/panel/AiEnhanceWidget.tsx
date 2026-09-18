"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud, Sparkles, Download, X, Loader2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

const MAX_CLIENT_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const INK = "#0E0E0E";
const GREEN = "#0A8F5C";
const MUTED = "#9AA0A6";

type Phase = "upload" | "ready" | "generating" | "result";

function base64ToBlobUrl(base64: string, mime = "image/png") {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

export function AiEnhanceWidget({
  creditsRemaining: initialCredits,
  creditsTotal,
}: {
  creditsRemaining: number;
  creditsTotal: number;
}) {
  const [phase, setPhase] = useState<Phase>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(initialCredits);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nothing about either image is durable anywhere — revoke every blob URL
  // this component ever creates the moment it's no longer needed.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFile(candidate: File | undefined | null) {
    if (!candidate) return;
    setError(null);
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setError("Formato no soportado. Usá PNG, JPEG o WEBP.");
      return;
    }
    if (candidate.size > MAX_CLIENT_FILE_BYTES) {
      setError("La imagen es demasiado pesada. Probá con una de menos de 15MB.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
    setPhase("ready");
  }

  async function handleGenerate() {
    if (!file || creditsRemaining <= 0) return;
    setError(null);
    setPhase("generating");
    setCreditsRemaining((c) => c - 1); // optimistic — the backend charges at the same moment

    try {
      const formData = new FormData();
      formData.set("image", file);

      const response = await fetch("/api/ai-enhance", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setCreditsRemaining((c) => c + 1); // refund already happened server-side — reflect it
        setError(data.error ?? "No se pudo generar la imagen.");
        setPhase("ready");
        return;
      }

      setResultUrl(base64ToBlobUrl(data.imageBase64));
      setDownloaded(false);
      setPhase("result");
    } catch {
      setCreditsRemaining((c) => c + 1);
      setError("No pude conectarme. Probá de nuevo.");
      setPhase("ready");
    }
  }

  function handleDownload() {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "foto-mejorada.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setDownloaded(true);
  }

  function resetAll() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setDownloaded(false);
    setError(null);
    setPhase("upload");
  }

  function requestClose() {
    if (downloaded) {
      resetAll();
    } else {
      setShowDiscardConfirm(true);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="font-display flex items-center gap-2 text-2xl font-semibold text-white">
          <Sparkles size={22} style={{ color: GREEN }} />
          Mejorar con IA
        </h1>
        <p className="text-sm" style={{ color: MUTED }}>
          Subí una foto de la propiedad y obtené una versión mejorada en segundos.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (phase === "upload") setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (phase === "upload") handleFile(e.dataTransfer.files[0]);
        }}
        className="relative overflow-hidden rounded-[20px] border-2 border-dashed transition-colors"
        style={{
          borderColor: dragOver ? GREEN : "rgba(255,255,255,0.12)",
          backgroundColor: dragOver ? "rgba(10,143,92,0.08)" : "rgba(255,255,255,0.03)",
          minHeight: 300,
        }}
      >
        {phase === "upload" ? (
          <label className="flex h-full min-h-[300px] w-full cursor-pointer flex-col items-center justify-center gap-3 px-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <UploadCloud size={36} style={{ color: MUTED }} />
            <div>
              <p className="font-display text-base font-semibold text-white">Arrastra tu foto aquí</p>
              <p className="text-sm" style={{ color: MUTED }}>
                o haz clic para elegir un archivo
              </p>
            </div>
          </label>
        ) : (
          <div className="relative h-[300px] w-full">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Foto subida" className="h-full w-full object-cover" />
            )}
            {phase === "generating" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
                <Loader2 size={32} className="animate-spin" style={{ color: GREEN }} />
                <p className="font-display text-sm font-medium text-white">Generando tu imagen…</p>
              </div>
            )}
          </div>
        )}
      </div>

      {phase !== "upload" && (
        <div
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        >
          <span className="min-w-0 truncate text-sm text-white/80">{file?.name}</span>
          <div className="flex shrink-0 items-center gap-3">
            <span
              className="rounded-full px-3 py-1 text-xs font-medium text-white/80"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              {creditsRemaining}/{creditsTotal} créditos
            </span>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={phase === "generating" || creditsRemaining <= 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: GREEN, color: INK }}
            >
              {phase === "generating" ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Generando…
                </>
              ) : (
                "Generar"
              )}
            </button>
          </div>
        </div>
      )}

      {creditsRemaining <= 0 && phase !== "upload" && (
        <p className="text-xs" style={{ color: MUTED }}>
          No te quedan créditos este mes.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {phase === "result" && resultUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-[440px] rounded-[24px] p-8" style={{ backgroundColor: "#141414" }}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-white">¡Tu foto está lista!</h2>
              <button type="button" onClick={requestClose} className="shrink-0 text-white/50 transition-colors hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="Foto mejorada" className="w-full rounded-xl" />

            <button
              type="button"
              onClick={handleDownload}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: GREEN, color: INK }}
            >
              <Download size={16} />
              Descargar
            </button>
            {downloaded && <p className="mt-2 text-center text-xs" style={{ color: GREEN }}>Descargada ✓</p>}
          </div>
        </div>
      )}

      <ConfirmModal
        open={showDiscardConfirm}
        title="¿Cerrar sin descargar?"
        message="La imagen generada se perderá y no podrás recuperarla."
        confirmLabel="Cerrar de todas formas"
        onCancel={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          resetAll();
        }}
      />
    </div>
  );
}
