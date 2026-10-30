"use client";

import { MessageCircle, Download, PartyPopper } from "lucide-react";
import { PanelBadge } from "@/components/panel/theme/PanelBadge";
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
      <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--ink-2)] p-8 text-center text-sm text-[var(--muted)]">
        {copy.affiliatePanel.avisosEmpty}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {notices.map((notice) => {
        const hasTrackedCommission = !notice.commission_is_estimate;
        const reportUrl = notice.report_path ? getPublicStorageUrl("deal-reports", notice.report_path) : null;
        const agreementUrl = notice.commission_agreement_path
          ? getPublicStorageUrl("commission-agreements", notice.commission_agreement_path)
          : null;
        const aliasMessage = `Hola, soy ${affiliateUsername} el afiliado de tu propiedad ${notice.property_title}. Mi alias bancario es ${affiliateAlias ?? "(sin definir)"}`;
        const contactMessage = `Hola ${notice.agent_name}! Soy afiliado en Agentia y vi que cerraste la venta de "${notice.property_title}". Quería consultarte sobre mi comisión.`;

        return (
          <div key={notice.id} className="flex flex-col gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--ink-2)] p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#13c47f1a] text-[var(--em-2)]">
                <PartyPopper size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words font-medium text-white">{notice.property_title}</p>
                  <PanelBadge tone="emerald">{copy.affiliatePanel.sold}</PanelBadge>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {notice.agent_name} · {notice.sold_at ? dateFmt(notice.sold_at) : ""}
                </p>
                <p className="mt-1 text-xs text-[#bdbdbd]">
                  {hasTrackedCommission ? "Comisión" : "Comisión estimada"}:{" "}
                  <span className="font-medium text-white">
                    {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(
                      notice.commission_amount
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 pl-12 sm:pl-0">
              {hasTrackedCommission && (
                <PanelBadge tone={notice.commission_paid_at ? "emerald" : "amber"}>
                  {notice.commission_paid_at ? copy.affiliatePanel.commissionPaid : copy.affiliatePanel.commissionPending}
                </PanelBadge>
              )}
              {reportUrl && (
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-2 py-1 text-[11px] font-medium text-[#bdbdbd] hover:bg-white/[0.06]"
                >
                  <Download size={12} />
                  {copy.panel.downloadReport}
                </a>
              )}
              {agreementUrl && (
                <a
                  href={agreementUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-[#13c47f55] bg-[#13c47f17] px-2 py-1 text-[11px] font-medium text-[var(--em-2)] hover:bg-[#13c47f2e]"
                >
                  <Download size={12} />
                  {copy.panel.downloadAgreement}
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
