import type { PropertyTypology } from "@/types/domain";

export function TypologiesTable({ typologies, currency }: { typologies: PropertyTypology[]; currency: string }) {
  if (typologies.length === 0) return null;

  const money = (amount: number) =>
    new Intl.NumberFormat("es-PY", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Tipologías</h2>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr>
              <th className="px-3 py-2">Tipología</th>
              <th className="px-3 py-2">Dorm.</th>
              <th className="px-3 py-2">m²</th>
              <th className="px-3 py-2">Precio desde</th>
              <th className="px-3 py-2">Disponibles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-white/80">
            {[...typologies]
              .sort((a, b) => a.position - b.position)
              .map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2">{t.name}</td>
                  <td className="px-3 py-2">{t.bedrooms ?? "—"}</td>
                  <td className="px-3 py-2">{t.area_m2 ?? "—"}</td>
                  <td className="px-3 py-2">{t.price_from != null ? money(t.price_from) : "—"}</td>
                  <td className="px-3 py-2">{t.units_available ?? "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
