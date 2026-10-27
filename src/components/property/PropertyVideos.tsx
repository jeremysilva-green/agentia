"use client";

import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { getYoutubeEmbedUrl } from "@/lib/youtube";
import { getInstagramEmbedUrl } from "@/lib/instagram";

type Source = "youtube" | "instagram";

// Instagram's embed is a cross-origin iframe, so its header/footer can't be
// restyled or hidden — the only option is to crop it. Measured on a real reel
// embed at 400px wide: a fixed 54px profile header, then a media box of
// ~400x495 with the 9:16 video centered in it (~279px wide) between black
// bars, then the "View more on Instagram" footer. The viewport below shows
// only the 9:16 video: the iframe is widened so the video fills the width
// (400 / 278.4 = 143.7%, centered), pulled up past the header, and clipped at
// the bottom of the video by overflow-hidden.
const IG_HEADER_PX = 54;
const IG_IFRAME_WIDTH_PCT = 143.7;

export function PropertyVideos({
  youtubeUrl,
  instagramUrl,
}: {
  youtubeUrl: string | null;
  instagramUrl: string | null;
}) {
  const [open, setOpen] = useState<Source | null>(null);

  const youtubeEmbed = youtubeUrl ? getYoutubeEmbedUrl(youtubeUrl) : null;
  const instagramEmbed = instagramUrl ? getInstagramEmbedUrl(instagramUrl) : null;
  if (!youtubeEmbed && !instagramEmbed) return null;

  const pills: { source: Source; label: string }[] = [];
  const both = Boolean(youtubeEmbed && instagramEmbed);
  if (youtubeEmbed) pills.push({ source: "youtube", label: both ? "Video · YouTube" : "Video" });
  if (instagramEmbed) pills.push({ source: "instagram", label: both ? "Video · Instagram" : "Video" });

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {pills.map(({ source, label }) => {
          const isOpen = open === source;
          return (
            <button
              key={source}
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : source)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                isOpen
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : "border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
              )}
            >
              <Play size={14} className="fill-current" />
              {label}
              <ChevronDown size={15} className={cn("transition-transform", isOpen && "rotate-180")} />
            </button>
          );
        })}
      </div>

      {/* Iframes are only mounted while open, so nothing loads from YouTube
          or Instagram until the visitor actually asks for the video. */}
      {open === "youtube" && youtubeEmbed && (
        <div className="animate-fade-in aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <iframe
            title="Video de la propiedad"
            src={`${youtubeEmbed}?rel=0&modestbranding=1&playsinline=1`}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {open === "instagram" && instagramEmbed && (
        <div
          className="animate-fade-in relative mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl bg-black"
          style={{ aspectRatio: "9 / 16" }}
        >
          <iframe
            title="Video de Instagram de la propiedad"
            src={instagramEmbed}
            className="absolute border-0"
            style={{
              top: -IG_HEADER_PX,
              left: `-${(IG_IFRAME_WIDTH_PCT - 100) / 2}%`,
              width: `${IG_IFRAME_WIDTH_PCT}%`,
              height: `calc(100% + ${IG_HEADER_PX + 300}px)`,
            }}
            allow="clipboard-write; encrypted-media; picture-in-picture"
          />
        </div>
      )}
    </div>
  );
}
