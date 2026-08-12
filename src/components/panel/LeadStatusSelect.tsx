"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { updateLeadStatus } from "@/lib/actions/leads";
import { LEAD_STATUS_VALUES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/constants/leadStatus";

export function LeadStatusSelect({
  leadId,
  status,
  hasAffiliate,
}: {
  leadId: string;
  status: LeadStatus;
  hasAffiliate: boolean;
}) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // When there's an affiliate to pay, "sold" is only reachable through the
  // "Trato cerrado" commission flow — picking it here would silently do
  // nothing (no PDF, no notification), which is confusing.
  const options: LeadStatus[] = hasAffiliate
    ? LEAD_STATUS_VALUES.filter((value): value is Exclude<LeadStatus, "sold"> => value !== "sold")
    : [...LEAD_STATUS_VALUES];

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as LeadStatus;
    const previous = current;
    setCurrent(next);
    setError(null);
    startTransition(async () => {
      const result = await updateLeadStatus(leadId, next);
      if (result?.error) {
        setError(result.error);
        setCurrent(previous);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={current}
        onChange={handleChange}
        disabled={isPending}
        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
      >
        {options.map((value) => (
          <option key={value} value={value}>
            {LEAD_STATUS_LABELS[value]}
          </option>
        ))}
        {current === "sold" && hasAffiliate && (
          <option value="sold">{LEAD_STATUS_LABELS.sold}</option>
        )}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
