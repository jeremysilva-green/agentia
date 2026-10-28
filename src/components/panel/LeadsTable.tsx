"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Phone, Hash, Leaf, Search, Check } from "lucide-react";
import { PanelBadge } from "@/components/panel/theme/PanelBadge";
import { EmptyState } from "@/components/panel/theme/EmptyState";
import { LeadStatusSelect } from "@/components/panel/LeadStatusSelect";
import { CloseDealButton } from "@/components/panel/CloseDealButton";
import { PayAffiliateModal } from "@/components/panel/PayAffiliateModal";
import { CommissionAgreementModal } from "@/components/panel/CommissionAgreementModal";
import { MonthYearAccordion } from "@/components/panel/MonthYearAccordion";
import { normalizeText } from "@/lib/text";
import { copy } from "@/lib/copy";
import type { LeadPipelineRow } from "@/types/domain";

const AFFILIATE_PAYMENT_WINDOW_DAYS = 180;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// Counts down from the moment the deal closed (commission_confirmed_at) so
// the agent has a visible reminder of how long they have left to pay out
// the affiliate's commission.
function daysRemainingToPay(commissionConfirmedAt: string) {
  const deadline = new Date(commissionConfirmedAt);
  deadline.setDate(deadline.getDate() + AFFILIATE_PAYMENT_WINDOW_DAYS);
  const msRemaining = deadline.getTime() - Date.now();
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
}

function CodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copiar código"
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black px-2 py-1 font-mono text-[11px] font-semibold text-[#bdbdbd] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
    >
      {copied ? <Check size={11} /> : <Hash size={11} />}
      {code}
    </button>
  );
}

function LeadsForMonth({ rows, agentSlug }: { rows: LeadPipelineRow[]; agentSlug: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink-2)]">
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[920px] text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-[var(--line)] bg-white/[0.04] text-[11px] font-bold tracking-wide text-[#8d8d8d] uppercase">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-bold">{copy.panel.buyer}</th>
            <th className="whitespace-nowrap px-4 py-3 font-bold">
              {copy.panel.properties} · {copy.panel.referralCode}
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-bold">
              {copy.panel.date} · {copy.panel.traffic}
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-bold">{copy.panel.status}</th>
            <th className="whitespace-nowrap px-4 py-3 font-bold">{copy.panel.agreement}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {rows.map((row) => (
            <tr key={row.id} className="align-middle transition-colors hover:bg-white/[0.03]">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--em-2)] to-[var(--em)] text-[13px] font-bold text-white">
                    {initials(row.buyer_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold whitespace-nowrap text-white">{row.buyer_name}</p>
                    <p className="flex items-center gap-1 text-[12.5px] whitespace-nowrap text-[var(--muted)]">
                      <Phone size={11} />
                      {row.buyer_phone}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col items-start gap-1.5">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-[#e8e8e8]">
                    {row.property_title}
                    {row.property_id && (
                      <a
                        href={`/agentes/${agentSlug}/propiedades/${row.property_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--muted)] transition-colors hover:text-[var(--em-2)]"
                        title="Ver propiedad"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </span>
                  <CodeChip code={row.referral_code} />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col items-start gap-1.5">
                  <span className="text-sm whitespace-nowrap text-[#e0e0e0]">{formatDate(row.referral_date)}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-[#cfcfcf]">
                    <Leaf size={11} className="text-[var(--em-2)]" />
                    {row.affiliate_link_id ? copy.panel.trafficAffiliate : copy.panel.trafficOrganic}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <LeadStatusSelect leadId={row.id} status={row.status} hasAffiliate={Boolean(row.affiliate_link_id)} />
              </td>
              <td className="px-4 py-3">
                {!row.commission_confirmed_at && row.affiliate_link_id && (
                  <CloseDealButton
                    leadId={row.id}
                    defaultPrice={row.property_price}
                    currency={row.property_currency}
                    commission={row.commission_config}
                  />
                )}
                {row.commission_confirmed_at && row.affiliate_link_id && !row.commission_agreement_accepted_at && (
                  <>
                    <span className="text-[11px] font-medium text-amber-400">Falta aceptar el acuerdo</span>
                    <CommissionAgreementModal leadId={row.id} />
                  </>
                )}
                {row.commission_agreement_accepted_at && row.affiliate_link_id && (
                  <div className="flex flex-col items-start gap-1">
                    {row.commission_paid_at ? (
                      <>
                        <PanelBadge tone="emerald">{copy.panel.commissionPaid}</PanelBadge>
                        <PayAffiliateModal
                          leadId={row.id}
                          paid
                          affiliate={{
                            username: row.affiliate_username ?? "",
                            phone: row.affiliate_phone,
                            alias: row.affiliate_alias,
                            qrUrl: row.affiliate_qr_url,
                            avatarUrl: row.affiliate_avatar_url,
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] font-medium text-amber-400">
                          {copy.panel.payAffiliateDaysRemaining(daysRemainingToPay(row.commission_confirmed_at!))}
                        </span>
                        <PayAffiliateModal
                          leadId={row.id}
                          paid={false}
                          affiliate={{
                            username: row.affiliate_username ?? "",
                            phone: row.affiliate_phone,
                            alias: row.affiliate_alias,
                            qrUrl: row.affiliate_qr_url,
                            avatarUrl: row.affiliate_avatar_url,
                          }}
                        />
                      </>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LeadsTable({ rows, agentSlug }: { rows: LeadPipelineRow[]; agentSlug: string }) {
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const q = normalizeText(query.trim());
    if (!q) return rows;
    return rows.filter((row) =>
      [row.buyer_name, row.buyer_phone, row.property_title, row.referral_code].some((field) =>
        normalizeText(field ?? "").includes(q)
      )
    );
  }, [rows, query]);

  if (rows.length === 0) {
    return <EmptyState message={copy.panel.leadsEmpty} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--ink-2)] px-3.5 text-[var(--muted)] sm:w-72 sm:self-end">
        <Search size={16} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar nombre, teléfono, código…"
          className="w-full bg-transparent text-sm text-white placeholder:text-[var(--muted)] focus:outline-none"
        />
      </label>

      {filteredRows.length === 0 ? (
        <EmptyState message="Sin resultados. Probá con otro nombre, teléfono o código." />
      ) : (
        <MonthYearAccordion
          rows={filteredRows}
          getDate={(r) => r.referral_date}
          renderGroup={(monthRows) => <LeadsForMonth rows={monthRows} agentSlug={agentSlug} />}
          dark
        />
      )}
    </div>
  );
}
