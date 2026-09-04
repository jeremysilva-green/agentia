export function PropertyMap({ lat, lng }: { lat: number | null; lng: number | null }) {
  // Only renders when real coordinates exist — those only get set when the
  // agent pastes an actual Google Maps link (see resolveMapCoordinates in
  // src/lib/actions/properties.ts). Deliberately no fallback to the
  // free-text address field: a rough/incomplete address shouldn't produce
  // a map the agent never explicitly provided a link for.
  if (lat == null || lng == null) return null;

  const src = `https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=15&output=embed`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <iframe
        title="Ubicación de la propiedad"
        src={src}
        width="100%"
        height="280"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
