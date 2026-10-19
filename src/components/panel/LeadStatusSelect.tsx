"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { updateLeadStatus } from "@/lib/actions/leads";
import { LEAD_STATUS_VALUES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/constants/leadStatus";

const STATUS_COLOR: Record<LeadStatus, string> = {
  new: "#5aa9ff",
  contacted: "#13c47f",
  viewing: "#f5b942",
  offer: "#f5b942",
  negotiation: "#b28cff",
  reserved: "#b28cff",
  sold: "#13c47f",
};

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

  const dotColor = STATUS_COLOR[current];

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <span
          className="pointer-events-none absolute top-1/2 left-3 h-2 w-2 -translate-y-1/2 rounded-full"
          style={{ background: dotColor, boxShadow: `0 0 0 3px ${dotColor}40` }}
        />
        <select
          value={current}
          onChange={handleChange}
          disabled={isPending}
          style={{ borderColor: `${dotColor}66`, background: `${dotColor}1a` }}
          className="h-9 min-w-[150px] appearance-none rounded-xl border pr-7 pl-7 text-[13.5px] font-semibold text-white outline-none transition-colors disabled:opacity-60"
        >
          {options.map((value) => (
            <option key={value} value={value} className="bg-[#151515] text-white">
              {LEAD_STATUS_LABELS[value]}
            </option>
          ))}
          {current === "sold" && hasAffiliate && (
            <option value="sold" className="bg-[#151515] text-white">
              {LEAD_STATUS_LABELS.sold}
            </option>
          )}
        </select>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
