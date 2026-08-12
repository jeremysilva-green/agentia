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
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.affiliatePanel.image}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.affiliatePanel.property}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.clientRequest.price}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.status}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.affiliatePanel.link}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.affiliatePanel.createdAt}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const fullUrl = row.short_code
              ? `${siteUrl}/s/${row.short_code}`
              : `${siteUrl}/agentes/${row.agent_slug}/propiedades/${row.property_id}?ref=${affiliateUsername}`;

            return (
              <tr key={row.id} className="align-middle">
                <td className="px-4 py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/property-card/${row.property_id}?w=200`}
                    alt={row.property_title}
                    width={200}
                    height={250}
                    className="aspect-[4/5] w-20 rounded-lg border border-slate-200 object-cover"
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <p className="font-medium text-slate-900">{row.property_title}</p>
                  <p className="text-slate-500">{row.property_city}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                  {new Intl.NumberFormat("es-PY", {
                    style: "currency",
                    currency: row.property_currency,
                    maximumFractionDigits: 0,
                  }).format(row.property_price)}
                  {row.property_listing_type === "rent" && (
                    <span className="text-slate-400"> /mes</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <Badge
                    tone={statusTone[row.property_status]}
                    className={
                      row.property_status === "available"
                        ? "border-emerald-200! bg-emerald-50! text-emerald-700!"
                        : undefined
                    }
                  >
                    {statusLabel[row.property_status]}
                  </Badge>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col items-start gap-2">
                    <p className="max-w-[260px] truncate text-slate-500">{fullUrl}</p>
                    <div className="flex gap-1.5">
                      <CopyLinkButton url={fullUrl} />
                      <DownloadPromoCardButton propertyId={row.property_id} />
                    </div>
                    <div className="flex gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white">
                        <Eye size={11} />
                        {row.view_count} {copy.affiliatePanel.views}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white">
                        <MessageCircle size={11} />
                        {row.lead_count} {copy.affiliatePanel.leads}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-500">{dateFmt(row.created_at)}</td>
                <td className="px-4 py-4">
                  <DeleteAffiliateLinkButton linkId={row.id} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
