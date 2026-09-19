"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { X, User, MessageCircle, CircleDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { markCommissionPaid } from "@/lib/actions/leads";
import { copy } from "@/lib/copy";

type Affiliate = {
  username: string;
  phone: string | null;
  alias: string | null;
  qrUrl: string | null;
  avatarUrl: string | null;
};

// Trigger stays mounted (and clickable) regardless of paid state, so closing
// the modal never strands the agent without a way to see these details
// again — before paying, to double check the alias/QR, or after, for their
// own records.
export function PayAffiliateModal({
  leadId,
  paid,
  affiliate,
}: {
  leadId: string;
  paid: boolean;
  affiliate: Affiliate;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleMarkPaid() {
    setError(null);
    startTransition(async () => {
      const result = await markCommissionPaid(leadId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          paid
            ? "text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            : "inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700"
        }
      >
        {paid ? copy.panel.viewPaymentDetails : (
          <>
            <CircleDollarSign size={11} />
            {copy.panel.payAffiliate}
          </>
        )}
      </button>

      {open && (
        // whitespace-normal resets inheritance from LeadsTable's <td
        // className="whitespace-nowrap">, this modal's DOM parent — see
        // CommissionAgreementModal.tsx for why that matters even though
        // this is `fixed`.
        <div
          className="fixed inset-0 z-50 flex items-center justify-center whitespace-normal bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">{copy.panel.paymentDetailsTitle}</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                {affiliate.avatarUrl ? (
                  <Image src={affiliate.avatarUrl} alt={affiliate.username} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <User size={22} />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900">{affiliate.username}</p>
                {affiliate.phone && (
                  <a
                    href={buildWhatsAppUrl(affiliate.phone, `Hola ${affiliate.username}, te voy a pagar tu comisión.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#1fb855]"
                  >
                    <MessageCircle size={11} />
                    {affiliate.phone}
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.profile.alias}</p>
              <p className="mt-1 text-sm text-slate-900">{affiliate.alias || copy.panel.noAliasDefined}</p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.profile.qr}</p>
              {affiliate.qrUrl ? (
                <div className="relative h-40 w-40 overflow-hidden rounded-xl border border-slate-200">
                  <Image src={affiliate.qrUrl} alt={copy.profile.qr} fill className="object-cover" sizes="160px" />
                </div>
              ) : (
                <p className="text-sm text-slate-500">{copy.panel.noQrUploaded}</p>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {paid ? (
              <Badge tone="success">{copy.panel.commissionPaid}</Badge>
            ) : (
              <button
                type="button"
                onClick={handleMarkPaid}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CircleDollarSign size={14} />
                {isPending ? copy.panel.markingAsPaid : copy.panel.markAsPaid}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
