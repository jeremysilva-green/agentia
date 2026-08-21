import { MessageCircle } from "lucide-react";
import { ViewClientRequestModal } from "@/components/panel/ViewClientRequestModal";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants/propertyTypes";
import { copy } from "@/lib/copy";
import type { ClientRequest } from "@/types/domain";

const th = "px-3 py-2.5 font-medium";
const td = "px-3 py-2.5 align-top";

function priceRange(row: ClientRequest) {
  return row.price_min != null && row.price_max != null
    ? `Gs. ${Number(row.price_min).toLocaleString("es-PY")} - ${Number(row.price_max).toLocaleString("es-PY")}`
    : "—";
}

export function CompradorRequestsTable({ rows }: { rows: ClientRequest[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {copy.panel.solicitudesCompradorEmpty}
      </div>
    );
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => {
          const propertyType = row.property_type as PropertyType | null;
          const contactMessage = `Hola ${row.full_name}! Te escribo por tu búsqueda de propiedad en ${row.city} en Agently.`;

          return (
            <div key={row.id} className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-xs">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{row.full_name}</p>
                <p className="truncate text-slate-500">{row.phone}</p>
              </div>

              <div className="text-slate-700">
                <p>{propertyType ? PROPERTY_TYPE_LABELS[propertyType].es : "—"}</p>
                <p className="text-slate-500">{row.city}</p>
                <p className="text-slate-500">{priceRange(row)}</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={buildWhatsAppUrl(row.phone, contactMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-1 rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#1fb855]"
                >
                  <MessageCircle size={11} />
                  {copy.panel.solicitudesContactWhatsapp}
                </a>
                <ViewClientRequestModal row={row} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-emerald-200 bg-white sm:block">
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="sticky top-0 z-10 bg-emerald-600 text-[11px] uppercase tracking-wide text-white">
              <tr>
                <th className={`${th} w-[30%]`}>{copy.panel.solicitudesContact}</th>
                <th className={`${th} w-[30%]`}>{copy.panel.solicitudesType}</th>
                <th className={`${th} w-[40%]`}>{copy.panel.solicitudesViewRequest}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {rows.map((row) => {
                const propertyType = row.property_type as PropertyType | null;
                const contactMessage = `Hola ${row.full_name}! Te escribo por tu búsqueda de propiedad en ${row.city} en Agently.`;

                return (
                  <tr key={row.id}>
                    <td className={td}>
                      <p className="truncate font-medium text-slate-900">{row.full_name}</p>
                      <p className="truncate text-slate-500">{row.phone}</p>
                      <a
                        href={buildWhatsAppUrl(row.phone, contactMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#1fb855]"
                      >
                        <MessageCircle size={11} />
                        {copy.panel.solicitudesContactWhatsapp}
                      </a>
                    </td>
                    <td className={td + " text-slate-700"}>
                      <p className="truncate">{propertyType ? PROPERTY_TYPE_LABELS[propertyType].es : "—"}</p>
                      <p className="truncate text-slate-500">{row.city}</p>
                      <p className="truncate text-slate-500">{priceRange(row)}</p>
                    </td>
                    <td className={td}>
                      <ViewClientRequestModal row={row} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
