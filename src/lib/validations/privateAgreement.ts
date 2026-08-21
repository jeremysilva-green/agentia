import { z } from "zod";

const optionalText = z.string().trim().max(300).optional().or(z.literal(""));
const optionalNumber = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? Number(v) : null))
  .refine((v) => v === null || Number.isFinite(v), "Ingresá un número válido");

export const agentAgreementFieldsSchema = z.object({
  agent_name: z.string().trim().min(2, "Ingresá el nombre del agente"),
  agent_ruc: z.string().trim().min(3, "Ingresá el RUC del agente"),
  agent_phone: z.string().trim().min(6, "Ingresá un teléfono"),
  agent_email: z.string().trim().email("Ingresá un correo válido").optional().or(z.literal("")),
  agent_address: optionalText,
  commission: optionalText,
  commission_vat_included: z.coerce.boolean().optional(),
  commission_payment_timing: z.enum(["reserva", "cierre", "otro"]).optional().or(z.literal("")),
  commission_payment_other: optionalText,
  reservation_condition: optionalText,
  validity_months: optionalNumber,
  exclusivity: z.enum(["sin_exclusiva", "exclusiva"]).optional().or(z.literal("")),
  auto_renewal: z.coerce.boolean().optional(),
  agent_signed_name: optionalText,
});

export const ownerAgreementFieldsSchema = z.object({
  owner1_name: z.string().trim().min(2, "Ingresá el nombre del propietario"),
  owner1_ci: z.string().trim().min(3, "Ingresá el C.I. del propietario"),
  owner2_name: optionalText,
  owner2_ci: optionalText,
  owner_phone: z.string().trim().min(6, "Ingresá un teléfono"),
  owner_email: z.string().trim().email("Ingresá un correo válido").optional().or(z.literal("")),
  owner_address: optionalText,
  property_type: optionalText,
  property_city: z.string().trim().min(2, "Ingresá la ciudad"),
  property_district: optionalText,
  property_address: optionalText,
  land_area_m2: optionalNumber,
  built_area_m2: optionalNumber,
  finca_number: optionalText,
  padron_number: optionalText,
  sale_price: optionalNumber,
  sale_price_words: optionalText,
  allow_sign: z.coerce.boolean().optional(),
  owner_signed_name: optionalText,
});

export type AgentAgreementFieldsInput = z.infer<typeof agentAgreementFieldsSchema>;
export type OwnerAgreementFieldsInput = z.infer<typeof ownerAgreementFieldsSchema>;
