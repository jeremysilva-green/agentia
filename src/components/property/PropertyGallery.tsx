"use client";

import { useRef, useState, type TouchEvent } from "react";
import Image from "next/image";
import { ImageOff, ChevronLeft, ChevronRight } from "lucide-react";

const SWIPE_THRESHOLD = 40;

export function PropertyGallery({ imageUrls, title }: { imageUrls: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (imageUrls.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <ImageOff size={32} />
      </div>
    );
  }

  const hasMultiple = imageUrls.length > 1;

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
    <div className="flex flex-col gap-2">
      <div
        className="group relative aspect-video touch-pan-y overflow-hidden rounded-2xl bg-slate-100"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div key={active} className="animate-fade-in absolute inset-0">
          <Image src={imageUrls[active]} alt={title} fill className="object-cover" sizes="800px" priority />
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="Siguiente imagen"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {imageUrls.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Ir a la imagen ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    index === active ? "w-4 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto">
          {imageUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => goTo(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                index === active ? "border-sage" : "border-transparent"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
