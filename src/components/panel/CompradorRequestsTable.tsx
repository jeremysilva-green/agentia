"use client";

import { MessageCircle, Home, Search } from "lucide-react";
import { EmptyState } from "@/components/panel/theme/EmptyState";
import { ViewClientRequestModal } from "@/components/panel/ViewClientRequestModal";
import { DeleteClientRequestButton } from "@/components/panel/DeleteClientRequestButton";
import { MonthYearAccordion } from "@/components/panel/MonthYearAccordion";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants/propertyTypes";
import { copy } from "@/lib/copy";
import type { ClientRequest } from "@/types/domain";

const th = "px-3 py-2.5 font-bold";
const td = "px-3 py-2.5 align-top";

function priceRange(row: ClientRequest) {
  return row.price_min != null && row.price_max != null
    ? `Gs. ${Number(row.price_min).toLocaleString("es-PY")} - ${Number(row.price_max).toLocaleString("es-PY")}`
    : "—";
}

function CompradorRequestsForMonth({ rows }: { rows: ClientRequest[] }) {
  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => {
          const propertyType = row.property_type as PropertyType | null;
          const contactMessage = `Hola ${row.full_name}! Te escribo por tu búsqueda de propiedad en ${row.city} en Agentia.`;

          return (
            <div key={row.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] p-4 text-xs">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{row.full_name}</p>
                <p className="truncate text-[var(--muted)]">{row.phone}</p>
              </div>

              <div className="text-[#cfcfcf]">
                <p>{propertyType ? PROPERTY_TYPE_LABELS[propertyType].es : "—"}</p>
                <p className="text-[var(--muted)]">{row.city}</p>
                <p className="text-[var(--muted)]">{priceRange(row)}</p>
              </div>

              <div className="flex items-center justify-between gap-2">
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
                <DeleteClientRequestButton requestId={row.id} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] sm:block">
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-[var(--line)] bg-white/[0.04] text-[11px] font-bold tracking-wide text-[#8d8d8d] uppercase">
              <tr>
                <th className={`${th} w-[28%]`}>{copy.panel.solicitudesContact}</th>
                <th className={`${th} w-[28%]`}>{copy.panel.solicitudesType}</th>
                <th className={`${th} w-[36%]`}>{copy.panel.solicitudesViewRequest}</th>
                <th className={`${th} w-[8%]`} />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {rows.map((row) => {
                const propertyType = row.property_type as PropertyType | null;
                const contactMessage = `Hola ${row.full_name}! Te escribo por tu búsqueda de propiedad en ${row.city} en Agentia.`;

                return (
                  <tr key={row.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className={td}>
                      <p className="truncate font-medium text-white">{row.full_name}</p>
                      <p className="truncate text-[var(--muted)]">{row.phone}</p>
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
                    <td className={td + " text-[#cfcfcf]"}>
                      <p className="truncate">{propertyType ? PROPERTY_TYPE_LABELS[propertyType].es : "—"}</p>
                      <p className="truncate text-[var(--muted)]">{row.city}</p>
                      <p className="truncate text-[var(--muted)]">{priceRange(row)}</p>
                    </td>
                    <td className={td}>
                      <ViewClientRequestModal row={row} />
                    </td>
                    <td className={td}>
                      <DeleteClientRequestButton requestId={row.id} />
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

function CompradorEmptyIllustration() {
  return (
    <div className="relative h-[110px] w-[150px]">
      <span className="panel-illo-ring" />
      <span className="panel-illo-ring d2" />
      <Home size={52} strokeWidth={1.4} className="panel-bob absolute bottom-1 left-1/2 -translate-x-1/2 text-[#333]" />
      <span className="absolute top-2 right-6 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--em-2)] ring-1 ring-[var(--em-2)]/60">
        <Search size={16} />
      </span>
    </div>
  );
}

export function CompradorRequestsTable({ rows }: { rows: ClientRequest[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        illustration={<CompradorEmptyIllustration />}
        message={copy.panel.solicitudesCompradorEmpty}
        hint="Te avisamos cuando llegue la primera"
      />
    );
  }

  return (
    <MonthYearAccordion
      rows={rows}
      getDate={(r) => r.created_at}
      renderGroup={(monthRows) => <CompradorRequestsForMonth rows={monthRows} />}
      dark
    />
  );
}
