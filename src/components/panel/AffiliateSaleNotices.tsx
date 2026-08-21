"use client";

import { MessageCircle, Download, PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { getPublicStorageUrl } from "@/lib/storage";
import { copy } from "@/lib/copy";
import type { AffiliateSaleNotice } from "@/types/domain";

const dateFmt = (value: string) =>
  new Date(value).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" });

export function AffiliateSaleNotices({
  notices,
  affiliateUsername,
  affiliateAlias,
}: {
  notices: AffiliateSaleNotice[];
  affiliateUsername: string;
  affiliateAlias: string | null;
}) {
  if (notices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {copy.affiliatePanel.avisosEmpty}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {notices.map((notice) => {
        const hasTrackedCommission = !notice.commission_is_estimate;
        const reportUrl = notice.report_path ? getPublicStorageUrl("deal-reports", notice.report_path) : null;
        const aliasMessage = `Hola, soy ${affiliateUsername} el afiliado de tu propiedad ${notice.property_title}. Mi alias bancario es ${affiliateAlias ?? "(sin definir)"}`;
        const contactMessage = `Hola ${notice.agent_name}! Soy afiliado en Agentia y vi que cerraste la venta de "${notice.property_title}". Quería consultarte sobre mi comisión.`;

        return (
          <div key={notice.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <PartyPopper size={16} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{notice.property_title}</p>
                  <Badge tone="success" className="border-emerald-200! bg-emerald-50! text-emerald-700!">
                    {copy.affiliatePanel.sold}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {notice.agent_name} · {notice.sold_at ? dateFmt(notice.sold_at) : ""}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {hasTrackedCommission ? "Comisión" : "Comisión estimada"}:{" "}
                  <span className="font-medium text-slate-900">
                    {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(
                      notice.commission_amount
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 pl-12 sm:pl-0">
              {hasTrackedCommission && (
                <Badge tone={notice.commission_paid_at ? "success" : "warning"}>
                  {notice.commission_paid_at ? copy.affiliatePanel.commissionPaid : copy.affiliatePanel.commissionPending}
                </Badge>
              )}
              {reportUrl && (
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Download size={12} />
                  {copy.panel.downloadReport}
                </a>
              )}
              {!notice.commission_paid_at && notice.agent_phone && (
                <a
                  href={buildWhatsAppUrl(notice.agent_phone, hasTrackedCommission ? aliasMessage : contactMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#1fb855]"
                >
                  <MessageCircle size={11} />
                  {hasTrackedCommission ? copy.panel.sendAliasButton : copy.affiliatePanel.whatsappButton}
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
