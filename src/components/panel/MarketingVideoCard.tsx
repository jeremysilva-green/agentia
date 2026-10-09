"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Copy, Check, Download, MessageCircle, Trash2, Camera } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { deleteMarketingVideo } from "@/lib/actions/marketingVideo";
import { getPublicStorageUrl } from "@/lib/storage";
import { formatListingPrice } from "@/lib/marketing-video/price";
import { isVideoStale } from "@/lib/marketing-video/isStale";
import { canShareFile, fetchAsFile, shareVideoFile, buildWhatsAppShareUrl, downloadFile } from "@/lib/marketing-video/share";
import type { MarketingVideoRow } from "@/lib/data/marketingVideos";

export function MarketingVideoCard({ video }: { video: MarketingVideoRow }) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);

  const url = getPublicStorageUrl("marketing-videos", video.storage_path);
  const filename = `agentia-${video.property_id}.mp4`;
  const stale = isVideoStale(video, { updated_at: video.property_updated_at });

  // Pre-fetch the file on mount, not inside the share click handler —
  // Safari revokes navigator.share's permission once an `await` happens
  // inside the click handler itself (transient-activation requirement).
  useEffect(() => {
    fetchAsFile(url, filename)
      .then((file) => {
        fileRef.current = file;
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  async function handleCopyCaption() {
    await navigator.clipboard.writeText(video.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleShare(appHint: string) {
    setShareError(null);
    const file = fileRef.current;
    if (file && canShareFile(file)) {
      try {
        await shareVideoFile(file, video.caption);
        return;
      } catch {
        // User canceled the share sheet, or it failed — fall through to the desktop fallback below.
      }
    }

    if (appHint === "whatsapp") {
      window.open(buildWhatsAppShareUrl(video.caption), "_blank", "noopener,noreferrer");
      return;
    }

    setShareError("Descargá el video y subilo desde tu celular.");
    downloadFile(url, filename);
  }

  function handleDelete() {
    setConfirmOpen(false);
    startTransition(async () => {
      await deleteMarketingVideo(video.property_id);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="relative overflow-hidden rounded-xl bg-slate-900" style={{ aspectRatio: "9 / 16" }}>
        <video src={url} muted loop playsInline preload="metadata" controls className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-900">{video.property_title}</h3>
          {stale && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Desactualizado
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-emerald-700">
          {formatListingPrice(video.property_price, video.property_currency)}
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
        <p className="flex-1 text-xs text-slate-600">{video.caption}</p>
        <button
          type="button"
          onClick={handleCopyCaption}
          className="shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-200"
          title="Copiar texto"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleShare("instagram")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <Camera size={13} />
          Reels
        </button>
        <button
          type="button"
          onClick={() => handleShare("tiktok")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          TikTok
        </button>
        <button
          type="button"
          onClick={() => handleShare("whatsapp")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <MessageCircle size={13} />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => downloadFile(url, filename)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download size={13} />
          Descargar
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 size={13} />
          Eliminar
        </button>
      </div>

      {shareError && <p className="text-xs text-amber-600">{shareError}</p>}

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar video"
        message="¿Eliminar este video promocional? Esta acción no se puede deshacer."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
