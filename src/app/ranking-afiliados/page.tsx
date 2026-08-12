import { Trophy } from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { getAffiliateRankingForMonth } from "@/lib/data/affiliateRanking";

const RANK_STYLES = [
  "bg-amber-500 text-black",
  "bg-slate-300 text-black",
  "bg-amber-800 text-white",
];

export default async function RankingAfiliadosPage() {
  const { monthLabel, rows } = await getAffiliateRankingForMonth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />

      <div className="relative mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16 sm:px-6">
        <div className="text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
            <Trophy size={22} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">Ranking de Afiliados</h1>
          <p className="mt-2 text-sm text-slate-400">
            Los afiliados que más ventas cerraron ayudando a nuestros agentes.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg sm:p-8">
          <h2 className="font-display text-lg font-semibold text-white">
            Top afiliados de {monthLabel}
          </h2>

          {rows.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-neutral-700 p-8 text-center text-sm text-slate-500">
              Todavía no hay ventas cerradas este mes.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-neutral-800">
              {rows.map((row, i) => (
                <div key={row.name + i} className="flex items-center gap-4 py-3.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      RANK_STYLES[i] ?? "bg-neutral-800 text-slate-300"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate font-medium text-white">{row.name}</span>
                  <span className="whitespace-nowrap text-sm text-slate-400">
                    {row.count} {row.count === 1 ? "venta" : "ventas"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
