"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { updateAgendamientoStatus } from "@/lib/actions/agendamientos";
import {
  AGENDAMIENTO_STATUS_VALUES,
  AGENDAMIENTO_STATUS_LABELS,
  type AgendamientoStatus,
} from "@/lib/constants/agendamientoStatus";

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

  return (
    <div className="flex flex-col gap-1">
      <select
        value={current}
        onChange={handleChange}
        disabled={isPending}
        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
      >
        {AGENDAMIENTO_STATUS_VALUES.map((value) => (
          <option key={value} value={value}>
            {AGENDAMIENTO_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
