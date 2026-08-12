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

export function VendedorRequestsTable({ rows }: { rows: ClientRequest[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {copy.panel.solicitudesVendedorEmpty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[1080px] text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.solicitudesContact}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.solicitudesType}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.auth.city}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.solicitudesPrice}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.solicitudesDescription}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.status}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.solicitudesActions}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.report}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const propertyType = row.property_type as PropertyType | null;
            const contactMessage = `Hola ${row.full_name}! Te escribo por tu propiedad en ${row.city} que nos ofreciste en Agently.`;
            const reportUrl = row.last_report_path ? getPublicStorageUrl("vendor-reports", row.last_report_path) : null;
            const reportMessage = reportUrl
              ? `Hola ${row.full_name}! Te comparto el reporte de tu propiedad: ${reportUrl}`
              : "";

            return (
              <tr key={row.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-medium text-slate-900">{row.full_name}</p>
                  <p className="text-slate-500">{row.phone}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {propertyType ? PROPERTY_TYPE_LABELS[propertyType].es : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.city}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {row.price != null ? `Gs. ${Number(row.price).toLocaleString("es-PY")}` : "—"}
                </td>
                <td className="max-w-[220px] px-4 py-3 text-slate-500">
                  <p className="line-clamp-2">{row.description}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge tone={statusTone[row.status]}>{CLIENT_REQUEST_STATUS_LABELS[row.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1.5">
                    <a
                      href={buildWhatsAppUrl(row.phone, contactMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#1fb855]"
                    >
                      <MessageCircle size={11} />
                      {copy.panel.solicitudesContactWhatsapp}
                    </a>
                    {row.status === "pending" && <ClientRequestActions requestId={row.id} />}
                    {row.status === "approved" && row.resulting_property_id && (
                      <Link
                        href={`/panel/propiedades/${row.resulting_property_id}/editar`}
                        className="text-[11px] font-medium text-emerald-700 hover:underline"
                      >
                        {copy.panel.solicitudesViewDraft} →
                      </Link>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {row.status === "approved" ? (
                    reportUrl ? (
                      <div className="flex flex-col items-start gap-1.5">
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
                      </div>
                    ) : (
                      <p className="max-w-[160px] text-slate-400">{copy.panel.solicitudesReportPending}</p>
                    )
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
