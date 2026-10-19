"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { groupByRecency } from "@/lib/monthGroups";

function Pill({
  label,
  count,
  isExpanded,
  onClick,
  dark,
}: {
  label: string;
  count: number;
  isExpanded: boolean;
  onClick: () => void;
  dark?: boolean;
}) {
  if (dark) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={
          isExpanded
            ? "inline-flex w-fit items-center gap-2 self-start rounded-full border border-[var(--em-2)] bg-[var(--ink-2)] px-3.5 py-2 text-[13.5px] font-semibold text-[var(--em-2)]"
            : "inline-flex w-fit items-center gap-2 self-start rounded-full border border-[#13c47f44] bg-[var(--ink-2)] px-3.5 py-2 text-[13.5px] font-semibold text-[var(--em-2)]/80 hover:border-[#13c47f88] hover:text-[var(--em-2)]"
        }
      >
        <Calendar size={15} />
        {label}
        <span className="grid min-w-[22px] place-items-center rounded-full bg-[var(--em)] px-1.5 py-0.5 text-[11px] text-white">
          {count}
        </span>
        <ChevronDown size={14} className={cn("transition-transform", isExpanded && "rotate-180")} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isExpanded
          ? "self-start rounded-full border border-emerald-400 bg-black px-3 py-1.5 text-xs font-medium text-emerald-300"
          : "self-start rounded-full border border-emerald-500/30 bg-black px-3 py-1.5 text-xs font-medium text-emerald-400/80 hover:border-emerald-400/60 hover:text-emerald-300"
      }
    >
      {label} ({count})
    </button>
  );
}

// The last 12 months show as flat pills; anything older is grouped under a
// per-year pill that expands into its own month pills, so this never grows
// unbounded as an agent's account ages past a year.
//
// `dark` is purely additive — existing callers that don't pass it keep the
// default pill look (e.g. the affiliate panel's AffiliateLinksTable).
export function MonthYearAccordion<T>({
  rows,
  getDate,
  renderGroup,
  dark,
}: {
  rows: T[];
  getDate: (row: T) => string;
  renderGroup: (rows: T[]) => ReactNode;
  dark?: boolean;
}) {
  const { recentMonths, years } = useMemo(() => groupByRecency(rows, getDate), [rows, getDate]);
  // Dark (redesigned) panels show the most recent month open by default,
  // matching the mockups where the table is visible without an extra click.
  const [expandedMonth, setExpandedMonth] = useState<string | null>(dark ? (recentMonths[0]?.key ?? null) : null);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  function toggleMonth(key: string) {
    setExpandedMonth((current) => (current === key ? null : key));
  }

  function toggleYear(key: string) {
    setExpandedYear((current) => (current === key ? null : key));
    setExpandedMonth(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {recentMonths.map((m) => (
        <div key={m.key} className="flex flex-col gap-3">
          <Pill label={m.label} count={m.items.length} isExpanded={expandedMonth === m.key} onClick={() => toggleMonth(m.key)} dark={dark} />
          {expandedMonth === m.key && renderGroup(m.items)}
        </div>
      ))}

      {years.map((y) => {
        const isYearExpanded = expandedYear === y.key;
        const yearCount = y.months.reduce((sum, m) => sum + m.items.length, 0);
        return (
          <div key={y.key} className="flex flex-col gap-3">
            <Pill label={y.label} count={yearCount} isExpanded={isYearExpanded} onClick={() => toggleYear(y.key)} dark={dark} />
            {isYearExpanded && (
              <div className="flex flex-col gap-3 border-l border-white/10 pl-4">
                {y.months.map((m) => (
                  <div key={m.key} className="flex flex-col gap-3">
                    <Pill label={m.label} count={m.items.length} isExpanded={expandedMonth === m.key} onClick={() => toggleMonth(m.key)} dark={dark} />
                    {expandedMonth === m.key && renderGroup(m.items)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
