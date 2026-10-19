"use client";

import { Eye, Link as LinkIcon } from "lucide-react";
import { CopyLinkButton } from "@/components/panel/CopyLinkButton";
import { DownloadPromoCardButton } from "@/components/panel/DownloadPromoCardButton";
import { DeleteAgentSocialShareButton } from "@/components/panel/DeleteAgentSocialShareButton";
import { MonthYearAccordion } from "@/components/panel/MonthYearAccordion";
import { PanelBadge } from "@/components/panel/theme/PanelBadge";
import { EmptyState } from "@/components/panel/theme/EmptyState";
import { copy } from "@/lib/copy";
import type { AgentSocialShareRow } from "@/types/domain";

const statusTone = {
  available: "emerald",
  sold: "neutral",
  rented: "amber",
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

function relativeDate(value: string) {
  const days = Math.round((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

function AgentSocialSharesForMonth({ rows, siteUrl }: { rows: AgentSocialShareRow[]; siteUrl: string }) {
  return (
    <>
      {/* Mobile: image left, details right */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => {
          const fullUrl = `${siteUrl}/sa/${row.code}`;

          return (
            <div
              key={row.id}
              className="flex items-stretch gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] p-4 text-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/property-card/${row.property_id}?w=200`}
                alt={row.property_title}
                width={200}
                height={250}
                className="h-full w-16 shrink-0 rounded-lg border border-[var(--line)] object-cover"
              />

              <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                <div className="flex w-full items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{row.property_title}</p>
                    <p className="text-[var(--muted)]">
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
                    <PanelBadge tone={statusTone[row.property_status]}>{statusLabel[row.property_status]}</PanelBadge>
                    <DeleteAgentSocialShareButton shareId={row.id} />
                  </div>
                </div>

                <p className="flex max-w-full items-center gap-1.5 truncate text-[#6f6f6f]">
                  <LinkIcon size={11} className="shrink-0 text-[var(--em-2)]" />
                  {fullUrl}
                </p>
                <div className="flex items-center gap-1.5">
                  <CopyLinkButton url={fullUrl} dark />
                  <DownloadPromoCardButton propertyId={row.property_id} dark />
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-[#13c47f44] bg-[#13c47f17] px-2 py-1 text-[11px] font-medium text-[var(--em-2)]">
                    <Eye size={11} />
                    {row.click_count}
                  </span>
                </div>

                <p className="text-[11px] text-[#6f6f6f]">
                  {dateFmt(row.created_at)} · {relativeDate(row.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] sm:block">
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-[var(--line)] bg-white/[0.04] text-[11px] font-bold tracking-wide text-[#8d8d8d] uppercase">
              <tr>
                <th className="px-3 py-3 font-bold">{copy.affiliatePanel.property}</th>
                <th className="px-3 py-3 font-bold">{copy.panel.status}</th>
                <th className="px-3 py-3 font-bold">{copy.affiliatePanel.link}</th>
                <th className="px-3 py-3 font-bold">{copy.affiliatePanel.createdAt}</th>
                <th className="px-3 py-3 font-bold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {rows.map((row) => {
                const fullUrl = `${siteUrl}/sa/${row.code}`;

                return (
                  <tr key={row.id} className="align-middle transition-colors hover:bg-white/[0.03]">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/property-card/${row.property_id}?w=200`}
                          alt={row.property_title}
                          width={200}
                          height={250}
                          className="aspect-[4/5] w-10 shrink-0 rounded-md border border-[var(--line)] object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{row.property_title}</p>
                          <p className="truncate text-[var(--muted)]">
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
                      <PanelBadge tone={statusTone[row.property_status]}>{statusLabel[row.property_status]}</PanelBadge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <p className="flex max-w-[200px] items-center gap-1.5 truncate rounded-lg border border-white/[0.06] bg-black px-2.5 py-1.5 font-mono text-[var(--muted)]">
                          <LinkIcon size={12} className="shrink-0 text-[var(--em-2)]" />
                          {fullUrl}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <CopyLinkButton url={fullUrl} dark />
                          <DownloadPromoCardButton propertyId={row.property_id} dark />
                          <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-[#13c47f44] bg-[#13c47f17] px-2 py-1 text-[11px] font-medium text-[var(--em-2)]">
                            <Eye size={11} />
                            {row.click_count}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-[var(--muted)]">
                      {dateFmt(row.created_at)}
                      <br />
                      <span className="text-[11px] text-[#6f6f6f]">{relativeDate(row.created_at)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <DeleteAgentSocialShareButton shareId={row.id} />
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

export function AgentSocialSharesTable({ rows, siteUrl }: { rows: AgentSocialShareRow[]; siteUrl: string }) {
  if (rows.length === 0) {
    return <EmptyState message="Todavía no compartiste ninguna propiedad. Generá un enlace desde la ficha de una propiedad para empezar." />;
  }

  return (
    <MonthYearAccordion
      rows={rows}
      getDate={(r) => r.created_at}
      renderGroup={(monthRows) => <AgentSocialSharesForMonth rows={monthRows} siteUrl={siteUrl} />}
      dark
    />
  );
}
