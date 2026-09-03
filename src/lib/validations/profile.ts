import { z } from "zod";

export const profileSchema = z.object({
  alias: z.string().max(60, "El alias es muy largo").optional().or(z.literal("")),
  phone: z.string().min(6, "Ingresá un teléfono de contacto").optional().or(z.literal("")),
  ci: z.string().max(20, "El CI es muy largo").optional().or(z.literal("")),
});

export const agentProfileSchema = z.object({
  fullName: z.string().min(2, "Ingresá tu nombre completo"),
  phone: z.string().min(6, "Ingresá un teléfono de contacto"),
  city: z.string().min(2, "Ingresá tu ciudad"),
  ruc: z
    .string()
    .min(5, "Ingresá un RUC válido")
    .regex(/^[\d.-]+$/, "El RUC solo puede tener números, puntos y guiones"),
  brandName: z.string().max(80, "El nombre de marca es muy largo").optional().or(z.literal("")),
  // Fiscal fields, only required for FacturaSend electronic invoicing —
  // nullable at the DB level (existing agents don't have these on file
  // yet), same "optional now, filled going forward" pattern as ruc.
  ci: z.string().max(20, "El CI es muy largo").optional().or(z.literal("")),
  address: z.string().max(200, "La dirección es muy larga").optional().or(z.literal("")),
  sifenCityId: z.string().uuid().optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type AgentProfileInput = z.infer<typeof agentProfileSchema>;
