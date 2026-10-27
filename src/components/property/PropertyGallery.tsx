"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import Image from "next/image";
import { ImageOff, ChevronLeft, ChevronRight, X } from "lucide-react";

const SWIPE_THRESHOLD = 40;
const MAX_FRAME_HEIGHT = 560;

export function PropertyGallery({ imageUrls, title }: { imageUrls: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  if (imageUrls.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/25">
        <ImageOff size={32} />
      </div>
    );
  }

  const hasMultiple = imageUrls.length > 1;
  // Each photo keeps its own shape (vertical stays vertical) — the frame
  // follows the active image's real ratio once it loads, capped in height
  // so a tall photo doesn't take over the whole page.
  const activeRatio = ratios[imageUrls[active]] ?? 16 / 9;

  function recordRatio(url: string, width: number, height: number) {
    if (!width || !height) return;
    setRatios((prev) => (prev[url] ? prev : { ...prev, [url]: width / height }));
  }

  function goTo(index: number) {
    setActive(((index % imageUrls.length) + imageUrls.length) % imageUrls.length);
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta > SWIPE_THRESHOLD) goTo(active - 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(active + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative mx-auto w-full touch-pan-y overflow-hidden rounded-2xl border border-white/10 bg-neutral-800 cursor-pointer"
        style={{ aspectRatio: activeRatio, maxWidth: MAX_FRAME_HEIGHT * activeRatio }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setLightboxOpen(true)}
      >
        <div key={active} className="animate-fade-in absolute inset-0">
          <Image
            src={imageUrls[active]}
            alt={`${title} – foto ${active + 1}`}
            fill
            className="object-cover"
            sizes="800px"
            priority
            onLoad={(e) => recordRatio(imageUrls[active], e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
          />
        </div>
      </div>

      {hasMultiple && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goTo(active - 1);
            }}
            aria-label="Foto anterior"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:border-emerald-400 hover:text-emerald-400"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-1.5">
            {imageUrls.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(index);
                }}
                aria-label={`Ir a la imagen ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === active ? "w-6 bg-emerald-400" : "w-1.5 bg-white/25 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
          <span className="min-w-11 text-center text-xs font-semibold text-white/50">
            {active + 1} / {imageUrls.length}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goTo(active + 1);
            }}
            aria-label="Siguiente imagen"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:border-emerald-400 hover:text-emerald-400"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {lightboxOpen && (
        <PropertyLightbox
          imageUrls={imageUrls}
          title={title}
          initialIndex={active}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setActive}
        />
      )}
    </div>
  );
}

function PropertyLightbox({
  imageUrls,
  title,
  initialIndex,
  onClose,
  onIndexChange,
}: {
  imageUrls: string[];
  title: string;
  initialIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  function go(i: number) {
    const next = ((i % imageUrls.length) + imageUrls.length) % imageUrls.length;
    setIndex(next);
    onIndexChange(next);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    }
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95" onClick={onClose} role="dialog" aria-modal="true" aria-label="Galería en pantalla completa">
      <div className="flex items-center justify-between px-5 py-4" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm font-semibold text-white/60">
          {index + 1} / {imageUrls.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white/80 transition-colors hover:border-emerald-400 hover:text-emerald-400"
        >
          <X size={18} />
        </button>
      </div>
      <div
        className="relative flex-1"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const delta = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (delta > SWIPE_THRESHOLD) go(index - 1);
          else if (delta < -SWIPE_THRESHOLD) go(index + 1);
        }}
      >
        <Image src={imageUrls[index]} alt={`${title} – foto ${index + 1}`} fill className="object-contain" sizes="100vw" />
        {imageUrls.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Imagen anterior"
              className="absolute top-1/2 left-4 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:border-emerald-400 hover:text-emerald-400"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Siguiente imagen"
              className="absolute top-1/2 right-4 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:border-emerald-400 hover:text-emerald-400"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
