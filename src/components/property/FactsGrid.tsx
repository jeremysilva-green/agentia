import { Ruler, BedDouble, Bath, Car, Home } from "lucide-react";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants/propertyTypes";

type Fact = { icon: React.ReactNode; label: string; value: string };

export function FactsGrid({
  areaM2,
  bedrooms,
  bathrooms,
  garage,
  propertyType,
}: {
  areaM2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  garage: boolean;
  propertyType: string | null;
}) {
  const facts: Fact[] = [];

  if (areaM2 != null) {
    facts.push({ icon: <Ruler size={18} />, label: "Superficie", value: `${areaM2} m²` });
  }
  if (bedrooms != null) {
    facts.push({ icon: <BedDouble size={18} />, label: "Dormitorios", value: String(bedrooms) });
  }
  if (bathrooms != null) {
    facts.push({ icon: <Bath size={18} />, label: "Baños", value: String(bathrooms) });
  }
  if (garage) {
    facts.push({ icon: <Car size={18} />, label: "Garage", value: "Sí" });
  }
  const typeLabel = propertyType ? PROPERTY_TYPE_LABELS[propertyType as PropertyType]?.es : undefined;
  if (typeLabel) {
    facts.push({ icon: <Home size={18} />, label: "Tipo", value: typeLabel });
  }

  if (facts.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Características</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-emerald-700/60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              {fact.icon}
            </span>
            <span className="mt-3 block text-[11px] font-semibold tracking-wide text-white/40 uppercase">
              {fact.label}
            </span>
            <span className="font-display mt-0.5 block text-lg font-semibold text-white">{fact.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
