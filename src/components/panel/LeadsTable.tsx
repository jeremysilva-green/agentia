import { Badge } from "@/components/ui/Badge";
import { LeadStatusSelect } from "@/components/panel/LeadStatusSelect";
import { CloseDealButton } from "@/components/panel/CloseDealButton";
import { MarkPaidButton } from "@/components/panel/MarkPaidButton";
import { getPublicStorageUrl } from "@/lib/storage";
import { copy } from "@/lib/copy";
import type { LeadPipelineRow } from "@/types/domain";

export function LeadsTable({ rows }: { rows: LeadPipelineRow[] }) {
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
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.referralCode}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.referredBy}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.protectedUntil}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.status}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.report}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="whitespace-nowrap px-4 py-3">
                <p className="font-medium text-slate-900">{row.buyer_name}</p>
                <p className="text-slate-500">{row.buyer_phone}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-900">{row.property_title}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{row.referral_code}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {row.affiliate_username ? `@${row.affiliate_username}` : copy.panel.directTraffic}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {new Date(row.protected_until).toLocaleDateString("es-PY", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
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
                {row.commission_confirmed_at && row.report_path && (
                  <div className="flex flex-col items-start gap-1.5">
                    <div className="flex items-center gap-2">
                      <Badge tone="success">{copy.panel.statusCerrado}</Badge>
                      <a
                        href={getPublicStorageUrl("deal-reports", row.report_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        {copy.panel.downloadReport}
                      </a>
                    </div>
                    {row.affiliate_link_id &&
                      (row.commission_paid_at ? (
                        <Badge tone="success">Comisión pagada</Badge>
                      ) : (
                        <MarkPaidButton leadId={row.id} />
                      ))}
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
