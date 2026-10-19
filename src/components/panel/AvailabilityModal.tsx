"use client";

import { useMemo, useState, useTransition } from "react";
import { X, CalendarClock, Check } from "lucide-react";
import { DAY_OF_WEEK_VALUES, DAY_OF_WEEK_LABELS, type DayOfWeek } from "@/lib/constants/dayOfWeek";
import { saveAvailability } from "@/lib/actions/availability";
import { copy } from "@/lib/copy";
import type { AgentAvailability } from "@/types/domain";

type DayState = { checked: boolean; start: string; end: string };

function initialState(availability: AgentAvailability[]): Record<DayOfWeek, DayState> {
  const byDay = new Map(availability.map((entry) => [entry.day_of_week, entry]));
  return Object.fromEntries(
    DAY_OF_WEEK_VALUES.map((day) => {
      const existing = byDay.get(day);
      return [
        day,
        {
          checked: Boolean(existing),
          start: existing?.start_time.slice(0, 5) ?? "08:00",
          end: existing?.end_time.slice(0, 5) ?? "11:00",
        },
      ];
    })
  ) as Record<DayOfWeek, DayState>;
}

function minutesOf(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatHours(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function AvailabilityModal({
  availability,
  onClose,
}: {
  availability: AgentAvailability[];
  onClose: () => void;
}) {
  const [days, setDays] = useState<Record<DayOfWeek, DayState>>(() => initialState(availability));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleDay(day: DayOfWeek) {
    setDays((prev) => ({ ...prev, [day]: { ...prev[day], checked: !prev[day].checked } }));
  }

  function updateTime(day: DayOfWeek, field: "start" | "end", value: string) {
    setDays((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function applyQuick(action: "week" | "all" | "copy" | "none") {
    setDays((prev) => {
      const base = prev.lunes;
      const next = { ...prev };
      DAY_OF_WEEK_VALUES.forEach((day, i) => {
        if (action === "week") next[day] = { ...next[day], checked: i < 5 };
        if (action === "all") next[day] = { ...next[day], checked: true };
        if (action === "none") next[day] = { ...next[day], checked: false };
        if (action === "copy" && day !== "lunes" && next[day].checked) {
          next[day] = { ...next[day], start: base.start, end: base.end };
        }
      });
      return next;
    });
  }

  const { activeDays, totalMinutes, hasError } = useMemo(() => {
    let activeDays = 0;
    let totalMinutes = 0;
    let hasError = false;
    DAY_OF_WEEK_VALUES.forEach((day) => {
      const d = days[day];
      if (!d.checked) return;
      const ok = minutesOf(d.end) > minutesOf(d.start);
      if (!ok) {
        hasError = true;
        return;
      }
      activeDays += 1;
      totalMinutes += minutesOf(d.end) - minutesOf(d.start);
    });
    return { activeDays, totalMinutes, hasError };
  }, [days]);

  function handleSave() {
    setError(null);
    const entries = DAY_OF_WEEK_VALUES.filter((day) => days[day].checked).map((day) => ({
      day_of_week: day,
      start_time: days[day].start,
      end_time: days[day].end,
    }));

    startTransition(async () => {
      const result = await saveAvailability(entries);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-8 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[var(--ink-2)] shadow-2xl sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 border-b border-white/[0.06] bg-gradient-to-b from-[#0A8F5C1a] to-transparent p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#13c47f44] bg-[#13c47f1f] text-[var(--em-2)]">
            <CalendarClock size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <b className="font-display text-xl font-semibold text-white">{copy.panel.availabilityModalTitle}</b>
            <p className="mt-1 text-[13.5px] text-[var(--muted)]">{copy.panel.availabilityModalSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--line)] text-[var(--muted)] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          <div className="mb-1 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyQuick("week")}
              className="rounded-full border border-[var(--line)] bg-[var(--ink)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#cfcfcf] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
            >
              Lun a Vie
            </button>
            <button
              type="button"
              onClick={() => applyQuick("all")}
              className="rounded-full border border-[var(--line)] bg-[var(--ink)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#cfcfcf] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
            >
              Todos los días
            </button>
            <button
              type="button"
              onClick={() => applyQuick("copy")}
              className="rounded-full border border-[var(--line)] bg-[var(--ink)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#cfcfcf] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
            >
              Copiar horario de Lunes
            </button>
            <button
              type="button"
              onClick={() => applyQuick("none")}
              className="rounded-full border border-[var(--line)] bg-[var(--ink)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#cfcfcf] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
            >
              Ninguno
            </button>
          </div>

          {DAY_OF_WEEK_VALUES.map((day) => {
            const d = days[day];
            const invalid = d.checked && minutesOf(d.end) <= minutesOf(d.start);
            return (
              <div
                key={day}
                className={
                  invalid
                    ? "rounded-2xl border border-[#ff5a5a66] bg-[#ff5a5a0d]"
                    : d.checked
                      ? "rounded-2xl border border-[#13c47f66] bg-gradient-to-br from-[#0A8F5C1c] to-[var(--ink)]"
                      : "rounded-2xl border border-[var(--line)] bg-[var(--ink)]"
                }
              >
                <div className="flex cursor-pointer items-center gap-3 p-3.5" onClick={() => toggleDay(day)}>
                  <label className="relative h-6 w-[42px] shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={d.checked} onChange={() => toggleDay(day)} className="peer absolute inset-0 m-0 cursor-pointer opacity-0" />
                    <span className="pointer-events-none absolute inset-0 rounded-full bg-[#2a2a2a] transition-colors peer-checked:bg-[var(--em)]" />
                    <span className="pointer-events-none absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-[#cfcfcf] transition-transform peer-checked:translate-x-[18px] peer-checked:bg-white" />
                  </label>
                  <span className="flex-1 text-[15px] font-semibold text-white">{DAY_OF_WEEK_LABELS[day]}</span>
                  <span className={invalid ? "text-[12.5px] text-[#ff8a8a]" : d.checked ? "text-[12.5px] text-[var(--em-2)]" : "text-[12.5px] text-[var(--muted)]"}>
                    {invalid ? "Revisá el horario" : d.checked ? `${d.start} – ${d.end}` : "No disponible"}
                  </span>
                </div>

                {d.checked && (
                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2.5 px-3.5 pb-3.5 pl-[66px]">
                    <div>
                      <label className="text-[11.5px] font-bold tracking-[0.08em] text-[#8d8d8d] uppercase">{copy.panel.availabilityFrom}</label>
                      <input
                        type="time"
                        step={900}
                        value={d.start}
                        onChange={(e) => updateTime(day, "start", e.target.value)}
                        className="mt-1.5 block h-[42px] w-full rounded-xl border border-[var(--line)] bg-[var(--ink-2)] px-3 text-[15px] font-semibold text-white outline-none [color-scheme:dark] focus:border-[var(--em)]"
                      />
                    </div>
                    <span className="pb-3 text-[var(--muted)]">→</span>
                    <div>
                      <label className="text-[11.5px] font-bold tracking-[0.08em] text-[#8d8d8d] uppercase">{copy.panel.availabilityTo}</label>
                      <input
                        type="time"
                        step={900}
                        value={d.end}
                        onChange={(e) => updateTime(day, "end", e.target.value)}
                        className="mt-1.5 block h-[42px] w-full rounded-xl border border-[var(--line)] bg-[var(--ink-2)] px-3 text-[15px] font-semibold text-white outline-none [color-scheme:dark] focus:border-[var(--em)]"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/[0.06] bg-[var(--ink-2)] p-4">
          <div className="mb-3 flex justify-between text-[13px] text-[var(--muted)]">
            <span>
              <b className="text-white">{activeDays}</b> {activeDays === 1 ? "día activo" : "días activos"}
            </span>
            <span>
              <b className="text-white">{formatHours(totalMinutes)}</b> por semana
            </span>
          </div>
          {error && <p className="mb-3 text-sm text-[#ff8a8a]">{error}</p>}
          <button
            type="button"
            disabled={pending || hasError}
            onClick={handleSave}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--em)] text-[15.5px] font-semibold text-white shadow-[0_12px_34px_-12px_var(--em-glow)] transition-colors hover:bg-[var(--em-2)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={18} />
            {pending ? copy.panel.availabilitySaving : copy.panel.availabilitySave}
          </button>
        </div>
      </div>
    </div>
  );
}
