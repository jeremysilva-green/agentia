export const DAY_OF_WEEK_VALUES = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;

export type DayOfWeek = (typeof DAY_OF_WEEK_VALUES)[number];

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

export function isDayOfWeek(value: string): value is DayOfWeek {
  return (DAY_OF_WEEK_VALUES as readonly string[]).includes(value);
}
