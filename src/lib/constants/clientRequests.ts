export const CLIENT_REQUEST_KIND_VALUES = ["vendedor", "comprador"] as const;
export type ClientRequestKind = (typeof CLIENT_REQUEST_KIND_VALUES)[number];

export const CLIENT_REQUEST_STATUS_VALUES = ["pending", "approved", "rejected"] as const;
export type ClientRequestStatus = (typeof CLIENT_REQUEST_STATUS_VALUES)[number];

export const CLIENT_REQUEST_STATUS_LABELS: Record<ClientRequestStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export function isClientRequestKind(value: string): value is ClientRequestKind {
  return (CLIENT_REQUEST_KIND_VALUES as readonly string[]).includes(value);
}

export function isClientRequestStatus(value: string): value is ClientRequestStatus {
  return (CLIENT_REQUEST_STATUS_VALUES as readonly string[]).includes(value);
}
