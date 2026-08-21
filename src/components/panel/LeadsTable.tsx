import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LeadStatusSelect } from "@/components/panel/LeadStatusSelect";
import { CloseDealButton } from "@/components/panel/CloseDealButton";
import { MarkPaidButton } from "@/components/panel/MarkPaidButton";
import { copy } from "@/lib/copy";
import type { LeadPipelineRow } from "@/types/domain";

const AFFILIATE_PAYMENT_WINDOW_DAYS = 180;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" });
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

export function LeadsTable({ rows, agentSlug }: { rows: LeadPipelineRow[]; agentSlug: string }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {copy.panel.leadsEmpty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.buyer}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.properties}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.date}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.traffic}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.referralCode}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.status}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.agreement}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="whitespace-nowrap px-4 py-3">
                <p className="font-medium text-slate-900">{row.buyer_name}</p>
                <p className="text-slate-500">{row.buyer_phone}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-900">
                <span className="inline-flex items-center gap-1.5">
                  {row.property_title}
                  {row.property_id && (
                    <a
                      href={`/agentes/${agentSlug}/propiedades/${row.property_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 transition-colors hover:text-emerald-600"
                      title="Ver propiedad"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(row.referral_date)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {row.affiliate_link_id ? copy.panel.trafficAffiliate : copy.panel.trafficOrganic}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{row.referral_code}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <LeadStatusSelect leadId={row.id} status={row.status} hasAffiliate={Boolean(row.affiliate_link_id)} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {!row.commission_confirmed_at && row.affiliate_link_id && (
                  <CloseDealButton
                    leadId={row.id}
                    defaultPrice={row.property_price}
                    currency={row.property_currency}
                  />
                )}
                {row.commission_confirmed_at && row.affiliate_link_id && (
                  <div className="flex flex-col items-start gap-1">
                    {row.commission_paid_at ? (
                      <Badge tone="success">{copy.panel.commissionPaid}</Badge>
                    ) : (
                      <>
                        <span className="text-[11px] font-medium text-amber-700">
                          {copy.panel.payAffiliateDaysRemaining(daysRemainingToPay(row.commission_confirmed_at))}
                        </span>
                        <MarkPaidButton leadId={row.id} />
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
  );
}
