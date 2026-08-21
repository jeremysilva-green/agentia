"use client";

import { useState, useTransition } from "react";
import { CircleDollarSign } from "lucide-react";
import { markCommissionPaid } from "@/lib/actions/leads";
import { copy } from "@/lib/copy";

export function MarkPaidButton({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await markCommissionPaid(leadId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <CircleDollarSign size={11} />
        {isPending ? "Guardando..." : copy.panel.payAffiliate}
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
