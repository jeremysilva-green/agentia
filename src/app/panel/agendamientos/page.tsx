import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentAgendamientos } from "@/lib/data/agendamientos";
import { getAgentAvailability } from "@/lib/data/availability";
import { AgendamientosTable } from "@/components/panel/AgendamientosTable";
import { AvailabilityButton } from "@/components/panel/AvailabilityButton";
import { DAY_OF_WEEK_VALUES, type DayOfWeek } from "@/lib/constants/dayOfWeek";
import { Reveal } from "@/components/panel/theme/Reveal";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";

const DAY_SHORT: Record<DayOfWeek, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

function currentWeekDays() {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return DAY_OF_WEEK_VALUES.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return { day, date };
  });
}

export default async function AgendamientosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const [rows, availability] = await Promise.all([
    getAgentAgendamientos(user.id),
    getAgentAvailability(user.id),
  ]);

  const availabilityByDay = new Map(availability.map((entry) => [entry.day_of_week, entry]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week = currentWeekDays();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
            <span className="panel-pulse-dot" />
            Visitas
          </div>
          <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">{copy.panel.agendamientos}</h1>
        </div>
        <AvailabilityButton availability={availability} />
      </div>

      <Reveal>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-7">
          {week.map(({ day, date }) => {
            const slot = availabilityByDay.get(day);
            const isToday = date.getTime() === today.getTime();
            const isPast = date.getTime() < today.getTime();
            return (
              <div
                key={day}
                className={cn(
                  "rounded-[18px] border px-2.5 py-3.5 text-center transition-transform hover:-translate-y-0.5",
                  isToday
                    ? "border-transparent bg-gradient-to-br from-[#0a8f5c] to-[#05492f] shadow-[0_16px_36px_-18px_var(--em-glow)]"
                    : "border-[var(--line)] bg-[var(--ink-2)]",
                  isPast && !isToday && "opacity-45"
                )}
              >
                <span className={cn("text-[11.5px] font-bold tracking-[0.1em] uppercase", isToday ? "text-[#dff7ec]" : "text-[var(--muted)]")}>
                  {DAY_SHORT[day]}
                </span>
                <b className="mt-1 block font-display text-[26px] leading-none font-semibold text-white">{date.getDate()}</b>
                <span className={cn("mt-2 block min-h-[15px] text-[11px] font-semibold", isToday ? "text-white" : "text-[var(--em-2)]")}>
                  {slot ? `${slot.start_time.slice(0, 5)}–${slot.end_time.slice(0, 5)}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={1}>
        <AgendamientosTable rows={rows} availability={availability} />
      </Reveal>
    </div>
  );
}
