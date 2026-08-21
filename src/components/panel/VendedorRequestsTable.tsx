import Link from "next/link";
import { MessageCircle, Download } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ClientRequestActions } from "@/components/panel/ClientRequestActions";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { getPublicStorageUrl } from "@/lib/storage";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants/propertyTypes";
import { CLIENT_REQUEST_STATUS_LABELS } from "@/lib/constants/clientRequests";
import { copy } from "@/lib/copy";
import type { ClientRequest } from "@/types/domain";

const statusTone = { pending: "neutral", approved: "success", rejected: "danger" } as const;
const statusClassName = {
  pending: "border-red-200! bg-red-50! text-red-700!",
  approved: "border-emerald-200! bg-emerald-50! text-emerald-700!",
  rejected: undefined,
} as const;

const th = "px-3 py-2.5 font-medium";
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
          className="text-[11px] font-medium text-emerald-700 hover:underline"
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
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
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
          <p className="text-[11px] text-slate-400">{copy.panel.solicitudesReportPending}</p>
        ))}
      {row.status === "rejected" && <span className="text-slate-300">—</span>}
    </div>
  );
}

export function VendedorRequestsTable({ rows }: { rows: ClientRequest[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {copy.panel.solicitudesVendedorEmpty}
      </div>
    );
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => {
          const propertyType = row.property_type as PropertyType | null;
          const contactMessage = `Hola ${row.full_name}! Te escribo por tu propiedad en ${row.city} que nos ofreciste en Agently.`;

          return (
            <div key={row.id} className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{row.full_name}</p>
                  <p className="truncate text-slate-500">{row.phone}</p>
                </div>
                <Badge tone={statusTone[row.status]} className={statusClassName[row.status]}>
                  {CLIENT_REQUEST_STATUS_LABELS[row.status]}
                </Badge>
              </div>

              <div className="text-slate-700">
                <p>{propertyType ? PROPERTY_TYPE_LABELS[propertyType].es : "—"}</p>
                <p className="text-slate-500">{row.city}</p>
                <p className="text-slate-500">
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

              <Actions row={row} />
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
                <th className={`${th} w-[26%]`}>{copy.panel.solicitudesContact}</th>
                <th className={`${th} w-[22%]`}>{copy.panel.solicitudesType}</th>
                <th className={`${th} w-[14%]`}>{copy.panel.status}</th>
                <th className={`${th} w-[38%]`}>{copy.panel.solicitudesActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {rows.map((row) => {
                const propertyType = row.property_type as PropertyType | null;
                const contactMessage = `Hola ${row.full_name}! Te escribo por tu propiedad en ${row.city} que nos ofreciste en Agently.`;

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
                      <p className="truncate text-slate-500">
                        {row.price != null ? `${row.currency} ${Number(row.price).toLocaleString("es-PY")}` : "—"}
                      </p>
                    </td>
                    <td className={td}>
                      <Badge tone={statusTone[row.status]} className={statusClassName[row.status]}>
                        {CLIENT_REQUEST_STATUS_LABELS[row.status]}
                      </Badge>
                    </td>
                    <td className={td}>
                      <Actions row={row} />
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
