export const AGENDAMIENTO_STATUS_VALUES = ["pending", "confirmed", "cancelled", "completed"] as const;

export type AgendamientoStatus = (typeof AGENDAMIENTO_STATUS_VALUES)[number];

export const AGENDAMIENTO_STATUS_LABELS: Record<AgendamientoStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Realizada",
};

export function isAgendamientoStatus(value: string): value is AgendamientoStatus {
  return (AGENDAMIENTO_STATUS_VALUES as readonly string[]).includes(value);
}
