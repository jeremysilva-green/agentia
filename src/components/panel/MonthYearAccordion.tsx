"use client";

import { useMemo, useState, type ReactNode } from "react";
import { groupByRecency } from "@/lib/monthGroups";

function Pill({ label, count, isExpanded, onClick }: { label: string; count: number; isExpanded: boolean; onClick: () => void }) {
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
export function MonthYearAccordion<T>({
  rows,
  getDate,
  renderGroup,
}: {
  rows: T[];
  getDate: (row: T) => string;
  renderGroup: (rows: T[]) => ReactNode;
}) {
  const { recentMonths, years } = useMemo(() => groupByRecency(rows, getDate), [rows, getDate]);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
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
          <Pill label={m.label} count={m.items.length} isExpanded={expandedMonth === m.key} onClick={() => toggleMonth(m.key)} />
          {expandedMonth === m.key && renderGroup(m.items)}
        </div>
      ))}

      {years.map((y) => {
        const isYearExpanded = expandedYear === y.key;
        const yearCount = y.months.reduce((sum, m) => sum + m.items.length, 0);
        return (
          <div key={y.key} className="flex flex-col gap-3">
            <Pill label={y.label} count={yearCount} isExpanded={isYearExpanded} onClick={() => toggleYear(y.key)} />
            {isYearExpanded && (
              <div className="flex flex-col gap-3 border-l border-white/10 pl-4">
                {y.months.map((m) => (
                  <div key={m.key} className="flex flex-col gap-3">
                    <Pill label={m.label} count={m.items.length} isExpanded={expandedMonth === m.key} onClick={() => toggleMonth(m.key)} />
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
