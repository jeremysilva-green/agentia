import { MapPin } from "lucide-react";

export function PropertyMap({ lat, lng, label }: { lat: number | null; lng: number | null; label?: string }) {
  // Only renders when real coordinates exist — those only get set when the
  // agent pastes an actual Google Maps link (see resolveMapCoordinates in
  // src/lib/actions/properties.ts). Deliberately no fallback to the
  // free-text address field: a rough/incomplete address shouldn't produce
  // a map the agent never explicitly provided a link for.
  if (lat == null || lng == null) return null;

  const src = `https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=15&output=embed`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      <iframe
        title="Ubicación de la propiedad"
        src={src}
        width="100%"
        height="280"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {label && (
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-900/90 px-3.5 py-2.5 text-sm text-white backdrop-blur-sm">
          <MapPin size={16} className="text-emerald-400" />
          {label}
        </div>
      )}
    </div>
  );
}
