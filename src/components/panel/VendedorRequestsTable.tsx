"use client";

import Link from "next/link";
import { MessageCircle, Download, Mail, Inbox } from "lucide-react";
import { PanelBadge } from "@/components/panel/theme/PanelBadge";
import { EmptyState } from "@/components/panel/theme/EmptyState";
import { ClientRequestActions } from "@/components/panel/ClientRequestActions";
import { DeleteClientRequestButton } from "@/components/panel/DeleteClientRequestButton";
import { MonthYearAccordion } from "@/components/panel/MonthYearAccordion";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { getPublicStorageUrl } from "@/lib/storage";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants/propertyTypes";
import { CLIENT_REQUEST_STATUS_LABELS } from "@/lib/constants/clientRequests";
import { copy } from "@/lib/copy";
import type { ClientRequest } from "@/types/domain";

const statusTone = { pending: "amber", approved: "emerald", rejected: "red" } as const;

const th = "px-3 py-2.5 font-bold";
const td = "px-3 py-2.5 align-top";

function Actions({ row }: { row: ClientRequest }) {
  const reportUrl = row.last_report_path ? getPublicStorageUrl("vendor-reports", row.last_report_path) : null;
  const reportMessage = reportUrl ? `Hola ${row.full_name}! Te comparto el reporte de tu propiedad: ${reportUrl}` : "";

  return (
    <div className="flex flex-col items-start gap-1.5">
      {row.status === "pending" && <ClientRequestActions requestId={row.id} />}
      {row.status === "approved" && row.resulting_property_id && (
        <Link
          href={`/panel/propiedades/${row.resulting_property_id}/editar`}
          className="text-[11px] font-medium text-[var(--em-2)] hover:underline"
        >
          {copy.panel.solicitudesViewDraft} →
        </Link>
      )}
      {row.status === "approved" &&
        (reportUrl ? (
          <>
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#cfcfcf] hover:text-white"
            >
              <Download size={12} />
              {copy.panel.downloadReport}
            </a>
            <a
              href={buildWhatsAppUrl(row.phone, reportMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#1fb855]"
            >
              <MessageCircle size={11} />
              {copy.panel.solicitudesSendReport}
            </a>
          </>
        ) : (
          <p className="text-[11px] text-[var(--muted)]">{copy.panel.solicitudesReportPending}</p>
        ))}
      {row.status === "rejected" && <span className="text-[var(--muted)]">—</span>}
    </div>
  );
}

function VendedorRequestsForMonth({ rows }: { rows: ClientRequest[] }) {
  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => {
          const propertyType = row.property_type as PropertyType | null;
          const contactMessage = `Hola ${row.full_name}! Te escribo por tu propiedad en ${row.city} que nos ofreciste en Agentia.`;

          return (
            <div key={row.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] p-4 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{row.full_name}</p>
                  <p className="truncate text-[var(--muted)]">{row.phone}</p>
                </div>
                <PanelBadge tone={statusTone[row.status]}>{CLIENT_REQUEST_STATUS_LABELS[row.status]}</PanelBadge>
              </div>

              <div className="text-[#cfcfcf]">
                <p>{propertyType ? PROPERTY_TYPE_LABELS[propertyType].es : "—"}</p>
                <p className="text-[var(--muted)]">{row.city}</p>
                <p className="text-[var(--muted)]">
                  {row.price != null ? `${row.currency} ${Number(row.price).toLocaleString("es-PY")}` : "—"}
                </p>
              </div>

              <a
                href={buildWhatsAppUrl(row.phone, contactMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1 rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#1fb855]"
              >
                <MessageCircle size={11} />
                {copy.panel.solicitudesContactWhatsapp}
              </a>

              <div className="flex items-start justify-between gap-2">
                <Actions row={row} />
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
                <th className={`${th} w-[25%]`}>{copy.panel.solicitudesContact}</th>
                <th className={`${th} w-[21%]`}>{copy.panel.solicitudesType}</th>
                <th className={`${th} w-[13%]`}>{copy.panel.status}</th>
                <th className={`${th} w-[35%]`}>{copy.panel.solicitudesActions}</th>
                <th className={`${th} w-[6%]`} />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {rows.map((row) => {
                const propertyType = row.property_type as PropertyType | null;
                const contactMessage = `Hola ${row.full_name}! Te escribo por tu propiedad en ${row.city} que nos ofreciste en Agentia.`;

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
                      <p className="truncate text-[var(--muted)]">
                        {row.price != null ? `${row.currency} ${Number(row.price).toLocaleString("es-PY")}` : "—"}
                      </p>
                    </td>
                    <td className={td}>
                      <PanelBadge tone={statusTone[row.status]}>{CLIENT_REQUEST_STATUS_LABELS[row.status]}</PanelBadge>
                    </td>
                    <td className={td}>
                      <Actions row={row} />
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

function VendedorEmptyIllustration() {
  return (
    <div className="relative h-[110px] w-[150px]">
      <span className="panel-illo-ring" />
      <span className="panel-illo-ring d2" />
      <Mail size={26} className="panel-drop absolute top-2 left-[42%] -translate-x-1/2 text-[var(--em-2)]" />
      <Mail size={20} className="panel-drop d2 absolute top-2 left-[62%] -translate-x-1/2 text-[var(--em)]" />
      <Inbox size={58} strokeWidth={1.4} className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[#333]" />
    </div>
  );
}

export function VendedorRequestsTable({ rows }: { rows: ClientRequest[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        illustration={<VendedorEmptyIllustration />}
        message={copy.panel.solicitudesVendedorEmpty}
        hint="Te avisamos cuando llegue la primera"
      />
    );
  }

  return (
    <MonthYearAccordion
      rows={rows}
      getDate={(r) => r.created_at}
      renderGroup={(monthRows) => <VendedorRequestsForMonth rows={monthRows} />}
      dark
    />
  );
}
