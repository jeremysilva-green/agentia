export const LEAD_STATUS_VALUES = [
  "new",
  "contacted",
  "viewing",
  "offer",
  "negotiation",
  "reserved",
  "sold",
] as const;

export type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  viewing: "Visita",
  offer: "Oferta",
  negotiation: "Negociación",
  reserved: "Reservado",
  sold: "Vendido",
};

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUS_VALUES as readonly string[]).includes(value);
}
