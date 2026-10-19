"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { updateAgendamientoStatus } from "@/lib/actions/agendamientos";
import {
  AGENDAMIENTO_STATUS_VALUES,
  AGENDAMIENTO_STATUS_LABELS,
  type AgendamientoStatus,
} from "@/lib/constants/agendamientoStatus";

const STATUS_COLOR: Record<AgendamientoStatus, string> = {
  pending: "#f5b942",
  confirmed: "#13c47f",
  cancelled: "#ff6b6b",
  completed: "#5aa9ff",
};

export function AgendamientoStatusSelect({
  agendamientoId,
  status,
}: {
  agendamientoId: string;
  status: AgendamientoStatus;
}) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as AgendamientoStatus;
    const previous = current;
    setCurrent(next);
    setError(null);
    startTransition(async () => {
      const result = await updateAgendamientoStatus(agendamientoId, next);
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
          className="h-9 min-w-[130px] appearance-none rounded-xl border pr-7 pl-7 text-[13px] font-semibold text-white outline-none transition-colors disabled:opacity-60"
        >
          {AGENDAMIENTO_STATUS_VALUES.map((value) => (
            <option key={value} value={value} className="bg-[#151515] text-white">
              {AGENDAMIENTO_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
