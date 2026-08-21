"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { closeLeadDeal } from "@/lib/actions/leads";
import { AFFILIATE_COMMISSION_PCT } from "@/lib/constants/commission";
import { copy } from "@/lib/copy";

export function CloseDealButton({
  leadId,
  defaultPrice,
  currency,
}: {
  leadId: string;
  defaultPrice: number;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(defaultPrice);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const commissionAmount = Math.round(price * (AFFILIATE_COMMISSION_PCT / 100));

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await closeLeadDeal(leadId, price);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Button type="button" size="sm" className="whitespace-nowrap text-xs" onClick={() => setOpen(true)}>
        <CheckCircle2 size={13} />
        {copy.panel.closeDeal}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">{copy.panel.commissionModalTitle}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <Input
                id="salePrice"
                label={`${copy.panel.salePrice} (${currency})`}
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="sin puntos ni comas"
              />
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  {copy.panel.commissionDue} ({AFFILIATE_COMMISSION_PCT}%)
                </p>
                <p className="text-lg font-semibold text-emerald-800">
                  {currency} {commissionAmount.toLocaleString("es-PY")}
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="button" size="md" className="w-full" disabled={isPending} onClick={handleConfirm}>
                {isPending ? copy.panel.confirmingCommission : copy.panel.confirmCommission}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
