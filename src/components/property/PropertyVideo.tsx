import { getYoutubeEmbedUrl } from "@/lib/youtube";

export function PropertyVideo({ url }: { url: string | null }) {
  if (!url) return null;

  const embedUrl = getYoutubeEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <iframe
        title="Video de la propiedad"
        src={embedUrl}
        width="100%"
        height="280"
        style={{ border: 0, aspectRatio: "16 / 9", height: "auto" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
