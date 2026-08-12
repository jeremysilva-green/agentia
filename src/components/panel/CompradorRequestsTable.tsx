import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ClientRequestActions } from "@/components/panel/ClientRequestActions";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants/propertyTypes";
import { CLIENT_REQUEST_STATUS_LABELS } from "@/lib/constants/clientRequests";
import { copy } from "@/lib/copy";
import type { ClientRequest } from "@/types/domain";

const statusTone = { pending: "neutral", approved: "success", rejected: "danger" } as const;

export function CompradorRequestsTable({ rows }: { rows: ClientRequest[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {copy.panel.solicitudesCompradorEmpty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[960px] text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.solicitudesContact}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.solicitudesType}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.auth.city}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.solicitudesPriceRange}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.solicitudesDescription}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.status}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.solicitudesActions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const propertyType = row.property_type as PropertyType | null;
            const contactMessage = `Hola ${row.full_name}! Te escribo por tu búsqueda de propiedad en ${row.city} en Agently.`;

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
                  {row.price_min != null && row.price_max != null
                    ? `Gs. ${Number(row.price_min).toLocaleString("es-PY")} - ${Number(row.price_max).toLocaleString("es-PY")}`
                    : "—"}
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
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
