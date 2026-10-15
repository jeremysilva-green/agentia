// "Se cobra cuando" options for the Comisión y referidos section — what
// event the agent has agreed with the developer/constructora triggers their
// commission. Purely informational copy (shown on the public card and baked
// into the commission agreement PDF text), not a tracked workflow state —
// "Trato cerrado" stays the one system-tracked close event for every kind.
export const PROYECTO_EN_POZO_COMMISSION_TRIGGERS = [
  "Firma del boleto de compraventa",
  "Entrega de la unidad",
  "Pago de la cuota inicial",
] as const;

export const MODELO_COMMISSION_TRIGGERS = [
  "Desembolso del crédito",
  "Firma de contrato",
  "Aprobación del crédito",
] as const;

export const ATTRIBUTION_WINDOW_OPTIONS = [
  { value: "30", label: "30 días" },
  { value: "60", label: "60 días" },
  { value: "90", label: "90 días" },
  { value: "180", label: "180 días" },
  { value: "365", label: "365 días (12 meses)" },
];
