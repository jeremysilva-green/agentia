export function PropertyMap({
  lat,
  lng,
  address,
}: {
  lat: number | null;
  lng: number | null;
  address: string | null;
}) {
  const query = lat != null && lng != null ? `${lat},${lng}` : address;
  if (!query) return null;

  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;

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
