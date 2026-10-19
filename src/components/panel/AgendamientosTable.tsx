"use client";

import { CalendarClock } from "lucide-react";
import { DAY_OF_WEEK_LABELS } from "@/lib/constants/dayOfWeek";
import { AgendamientoStatusSelect } from "@/components/panel/AgendamientoStatusSelect";
import { AvailabilityButton } from "@/components/panel/AvailabilityButton";
import { MonthYearAccordion } from "@/components/panel/MonthYearAccordion";
import { EmptyState } from "@/components/panel/theme/EmptyState";
import { copy } from "@/lib/copy";
import type { AgendamientoRow, AgentAvailability } from "@/types/domain";

function dateFmt(value: string) {
  return new Date(value).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" });
}

function AgendamientosForMonth({ rows }: { rows: AgendamientoRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink-2)]">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-xs">
          <thead className="border-b border-[var(--line)] bg-white/[0.04] text-[11px] font-bold tracking-wide text-[#8d8d8d] uppercase">
            <tr>
              <th className="w-[24%] px-4 py-3 font-bold">{copy.panel.agendamientosClient}</th>
              <th className="w-[24%] px-4 py-3 font-bold">{copy.panel.agendamientosProperty}</th>
              <th className="w-[22%] px-4 py-3 font-bold">{copy.panel.agendamientosSchedule}</th>
              <th className="w-[15%] px-4 py-3 font-bold">{copy.panel.agendamientosStatus}</th>
              <th className="w-[15%] px-4 py-3 font-bold">{copy.panel.chatDate}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((row) => (
              <tr key={row.id} className="align-top transition-colors hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <p className="font-medium break-words text-white">{row.client_name}</p>
                  <p className="text-[var(--muted)]">{row.client_phone}</p>
                </td>
                <td className="px-4 py-3 break-words text-[#cfcfcf]">{row.property_title}</td>
                <td className="px-4 py-3 text-[#cfcfcf]">
                  {DAY_OF_WEEK_LABELS[row.day_of_week]} {row.start_time.slice(0, 5)}–{row.end_time.slice(0, 5)}
                </td>
                <td className="px-4 py-3">
                  <AgendamientoStatusSelect agendamientoId={row.id} status={row.status} />
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">{dateFmt(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AgendamientosIllustration() {
  return (
    <div className="relative h-[110px] w-[150px]">
      <span className="panel-illo-ring" />
      <span className="panel-illo-ring d2" />
      <span className="panel-bob absolute top-1 left-1/2 -translate-x-1/2 rounded-2xl border border-white/10 bg-[var(--ink)] p-3">
        <CalendarClock size={38} className="text-[var(--em-2)]" strokeWidth={1.4} />
      </span>
    </div>
  );
}

export function AgendamientosTable({ rows, availability }: { rows: AgendamientoRow[]; availability: AgentAvailability[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        illustration={<AgendamientosIllustration />}
        message={copy.panel.agendamientosEmpty}
        action={<AvailabilityButton availability={availability} variant="cta" label="Configurá tu disponibilidad" />}
      />
    );
  }

  return (
    <MonthYearAccordion rows={rows} getDate={(r) => r.created_at} renderGroup={(monthRows) => <AgendamientosForMonth rows={monthRows} />} dark />
  );
}
