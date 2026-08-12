"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        className="my-8 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:my-0 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{copy.panel.availabilityModalTitle}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{copy.panel.availabilityModalSubtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-slate-400 transition-colors hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {DAY_OF_WEEK_VALUES.map((day) => (
            <div
              key={day}
              className={
                days[day].checked
                  ? "rounded-xl border border-emerald-300 bg-emerald-50 p-3"
                  : "rounded-xl border border-slate-200 p-3"
              }
            >
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={days[day].checked}
                  onChange={() => toggleDay(day)}
                  className="h-4 w-4 rounded border-bone text-emerald-600 accent-emerald-600 focus-visible:outline-emerald-600"
                />
                {DAY_OF_WEEK_LABELS[day]}
              </label>

              {days[day].checked && (
                <div className="mt-2 flex items-center gap-2 pl-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">{copy.panel.availabilityFrom}</span>
                    <input
                      type="time"
                      value={days[day].start}
                      onChange={(e) => updateTime(day, "start", e.target.value)}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-prussian outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">{copy.panel.availabilityTo}</span>
                    <input
                      type="time"
                      value={days[day].end}
                      onChange={(e) => updateTime(day, "end", e.target.value)}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-prussian outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <Button
          type="button"
          size="md"
          className="mt-4 w-full bg-emerald-600! text-white! hover:bg-emerald-700!"
          disabled={pending}
          onClick={handleSave}
        >
          {pending ? copy.panel.availabilitySaving : copy.panel.availabilitySave}
        </Button>
      </div>
    </div>
  );
}
