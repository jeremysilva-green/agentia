"use client";

import { MessageCircle, Download } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { getPublicStorageUrl } from "@/lib/storage";
import { LEAD_STATUS_LABELS } from "@/lib/constants/leadStatus";
import { copy } from "@/lib/copy";
import type { AffiliateLeadRow } from "@/types/domain";

const dateFmt = (value: string) =>
  new Date(value).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" });

export function AffiliateDealsTable({
  deals,
  affiliateUsername,
  affiliateAlias,
}: {
  deals: AffiliateLeadRow[];
  affiliateUsername: string;
  affiliateAlias: string | null;
}) {
  if (deals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {copy.affiliatePanel.empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full table-fixed text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-[28%] px-3 py-3 font-medium">{copy.affiliatePanel.property}</th>
            <th className="w-[20%] px-3 py-3 font-medium">{copy.affiliatePanel.agent}</th>
            <th className="w-[16%] px-3 py-3 font-medium">{copy.panel.referralWindow}</th>
            <th className="w-[14%] px-3 py-3 font-medium">{copy.panel.status}</th>
            <th className="w-[22%] px-3 py-3 font-medium">{copy.panel.report}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {deals.map((deal) => {
            const reportUrl = deal.report_path ? getPublicStorageUrl("deal-reports", deal.report_path) : null;
            const contactMessage = `Hola ${deal.agent_name}! Soy afiliado en Agently y quería consultarte sobre "${deal.property_title}".`;
            const aliasMessage = `Hola, soy ${affiliateUsername} el afiliado de tu propiedad ${deal.property_title}. Mi alias bancario es ${affiliateAlias ?? "(sin definir)"}`;

            return (
              <tr key={deal.id} className="align-top">
                <td className="px-3 py-3">
                  <p className="truncate font-medium text-slate-900">{deal.property_title}</p>
                  <p className="text-slate-400">{deal.referral_code}</p>
                </td>
                <td className="px-3 py-3 text-slate-700">
                  <p className="truncate">{deal.agent_name}</p>
                  {deal.agent_phone && (
                    <a
                      href={buildWhatsAppUrl(deal.agent_phone, contactMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#1fb855]"
                    >
                      <MessageCircle size={11} />
                      {copy.affiliatePanel.whatsappButton}
                    </a>
                  )}
                </td>
                <td className="px-3 py-3 text-slate-500">
                  <p>{dateFmt(deal.referral_date)}</p>
                  <p className="text-slate-400">→ {dateFmt(deal.protected_until)}</p>
                </td>
                <td className="px-3 py-3">
                  <Badge tone={deal.commission_confirmed_at ? "success" : "neutral"}>
                    {LEAD_STATUS_LABELS[deal.status]}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  {deal.commission_confirmed_at && reportUrl && (
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
                      {deal.agent_phone && (
                        <a
                          href={buildWhatsAppUrl(deal.agent_phone, aliasMessage)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#1fb855]"
                        >
                          <MessageCircle size={11} />
                          {copy.panel.sendAliasButton}
                        </a>
                      )}
                    </div>
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
