"use client";

import { useState } from "react";
import Link from "next/link";
import { Video, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { uploadMarketingVideo } from "@/lib/marketing-video/upload";
import type { RenderProgress } from "@/lib/marketing-video/types";
import type { ListingVideoInput } from "@/lib/marketing-video/types";

type Phase = "idle" | "loading" | "rendering" | "uploading" | "done";

export function MarketingVideoGenerator({
  propertyId,
  agentId,
  listing,
  imageUrls,
  caption,
  hasExistingVideo,
  isStale,
}: {
  propertyId: string;
  agentId: string;
  listing: ListingVideoInput;
  imageUrls: string[];
  caption: string;
  hasExistingVideo: boolean;
  isStale: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setPhase("loading");
    setProgress(0);

    try {
      // Dynamically imported so mediabunny/the renderer never bloat the
      // edit page's main bundle — only loaded when this button is clicked.
      const { renderListingVideo } = await import("@/lib/marketing-video/renderListingVideo");

      const onProgress = (p: RenderProgress) => {
        if (p.phase === "render") {
          setPhase("rendering");
          setProgress(Math.round((p.frame / p.totalFrames) * 100));
        }
      };

      const blob = await renderListingVideo(listing, imageUrls, { onProgress });

      setPhase("uploading");
      const result = await uploadMarketingVideo({
        propertyId,
        agentId,
        blob,
        caption,
        listingUpdatedAt: new Date().toISOString(),
      });

      if ("error" in result) {
        setError(result.error);
        setPhase("idle");
        return;
      }

      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el video.");
      setPhase("idle");
    }
  }

  const buttonLabel = hasExistingVideo ? "Regenerar video" : "Generar video";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Video size={18} className="text-emerald-600" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Video promocional</h2>
        {isStale && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Desactualizado</span>
        )}
      </div>
      <p className="text-sm text-slate-500">
        Generá un video de 10 segundos con las fotos de esta propiedad, listo para compartir en Instagram, TikTok y WhatsApp.
      </p>

      {phase === "done" ? (
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={16} />
          ¡Video generado!{" "}
          <Link href="/panel/redes-sociales" className="underline">
            Ver en Redes Sociales
          </Link>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          disabled={phase !== "idle"}
          onClick={handleGenerate}
          className="w-fit border-black! bg-black! text-white! hover:bg-neutral-800!"
        >
          {phase === "idle" ? (
            <Video size={16} />
          ) : (
            <Loader2 size={16} className="animate-spin" />
          )}
          {phase === "idle" && buttonLabel}
          {phase === "loading" && "Preparando..."}
          {phase === "rendering" && `Generando video... ${progress}%`}
          {phase === "uploading" && "Subiendo..."}
        </Button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
