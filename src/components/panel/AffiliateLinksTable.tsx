import { Eye, MessageCircle } from "lucide-react";
import { CopyLinkButton } from "@/components/panel/CopyLinkButton";
import { DownloadPromoCardButton } from "@/components/panel/DownloadPromoCardButton";
import { DeleteAffiliateLinkButton } from "@/components/panel/DeleteAffiliateLinkButton";
import { Badge } from "@/components/ui/Badge";
import { copy } from "@/lib/copy";
import type { AffiliateLinkRow } from "@/types/domain";

const statusTone = {
  available: "success",
  sold: "neutral",
  rented: "warning",
  draft: "neutral",
} as const;

const statusLabel = {
  available: copy.property.available,
  sold: copy.property.sold,
  rented: copy.property.rented,
  draft: "Borrador",
} as const;

const dateFmt = (value: string) =>
  new Date(value).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" });

export function AffiliateLinksTable({
  rows,
  affiliateUsername,
}: {
  rows: AffiliateLinkRow[];
  affiliateUsername: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {copy.affiliatePanel.myLinksEmpty}
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      {/* Mobile: image left, details right */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => {
          const fullUrl = row.short_code
            ? `${siteUrl}/s/${row.short_code}`
            : `${siteUrl}/agentes/${row.agent_slug}/propiedades/${row.property_id}?ref=${affiliateUsername}`;

          return (
            <div
              key={row.id}
              className="flex items-stretch gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/property-card/${row.property_id}?w=200`}
                alt={row.property_title}
                width={200}
                height={250}
                className="h-full w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
              />

              <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                <div className="flex w-full items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{row.property_title}</p>
                    <p className="text-slate-500">
                      {row.property_city} ·{" "}
                      {new Intl.NumberFormat("es-PY", {
                        style: "currency",
                        currency: row.property_currency,
                        maximumFractionDigits: 0,
                      }).format(row.property_price)}
                      {row.property_listing_type === "rent" && "/mes"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      tone={statusTone[row.property_status]}
                      className={
                        row.property_status === "available"
                          ? "border-emerald-200! bg-emerald-50! text-emerald-700!"
                          : row.property_status === "sold"
                            ? "border-red-200! bg-red-100! text-red-700!"
                            : undefined
                      }
                    >
                      {statusLabel[row.property_status]}
                    </Badge>
                    <DeleteAffiliateLinkButton linkId={row.id} />
                  </div>
                </div>

                <p className="max-w-full truncate text-slate-400">{fullUrl}</p>
                <div className="flex items-center gap-1.5">
                  <CopyLinkButton url={fullUrl} />
                  <DownloadPromoCardButton propertyId={row.property_id} />
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white">
                    <Eye size={11} />
                    {row.view_count}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white">
                    <MessageCircle size={11} />
                    {row.lead_count}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">{dateFmt(row.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white sm:block">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3 font-medium">{copy.affiliatePanel.property}</th>
              <th className="px-3 py-3 font-medium">{copy.panel.status}</th>
              <th className="px-3 py-3 font-medium">{copy.affiliatePanel.link}</th>
              <th className="px-3 py-3 font-medium">{copy.affiliatePanel.createdAt}</th>
              <th className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const fullUrl = row.short_code
                ? `${siteUrl}/s/${row.short_code}`
                : `${siteUrl}/agentes/${row.agent_slug}/propiedades/${row.property_id}?ref=${affiliateUsername}`;

              return (
                <tr key={row.id} className="align-middle">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/property-card/${row.property_id}?w=200`}
                        alt={row.property_title}
                        width={200}
                        height={250}
                        className="aspect-[4/5] w-10 shrink-0 rounded-md border border-slate-200 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{row.property_title}</p>
                        <p className="truncate text-slate-500">
                          {row.property_city} ·{" "}
                          {new Intl.NumberFormat("es-PY", {
                            style: "currency",
                            currency: row.property_currency,
                            maximumFractionDigits: 0,
                          }).format(row.property_price)}
                          {row.property_listing_type === "rent" && "/mes"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge
                      tone={statusTone[row.property_status]}
                      className={
                        row.property_status === "available"
                          ? "border-emerald-200! bg-emerald-50! text-emerald-700!"
                          : row.property_status === "sold"
                            ? "border-red-200! bg-red-100! text-red-700!"
                            : undefined
                      }
                    >
                      {statusLabel[row.property_status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <p className="max-w-[180px] truncate text-slate-500">{fullUrl}</p>
                      <div className="flex items-center gap-1.5">
                        <CopyLinkButton url={fullUrl} />
                        <DownloadPromoCardButton propertyId={row.property_id} />
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white">
                          <Eye size={11} />
                          {row.view_count}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white">
                          <MessageCircle size={11} />
                          {row.lead_count}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-500">{dateFmt(row.created_at)}</td>
                  <td className="px-3 py-3">
                    <DeleteAffiliateLinkButton linkId={row.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
