import { getInstagramEmbedUrl } from "@/lib/instagram";

export function PropertyInstagramReel({ url }: { url: string | null }) {
  if (!url) return null;

  const embedUrl = getInstagramEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-2xl border border-slate-200">
      <iframe
        title="Reel de Instagram de la propiedad"
        src={embedUrl}
        width="100%"
        height="680"
        style={{ border: 0 }}
        allow="clipboard-write; encrypted-media; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}
