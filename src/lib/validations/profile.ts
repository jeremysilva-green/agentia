import { z } from "zod";

export const profileSchema = z.object({
  alias: z.string().max(60, "El alias es muy largo").optional().or(z.literal("")),
  phone: z.string().min(6, "Ingresá un teléfono de contacto").optional().or(z.literal("")),
});

export const agentProfileSchema = z.object({
  fullName: z.string().min(2, "Ingresá tu nombre completo"),
  phone: z.string().min(6, "Ingresá un teléfono de contacto"),
  city: z.string().min(2, "Ingresá tu ciudad"),
  ruc: z
    .string()
    .min(5, "Ingresá un RUC válido")
    .regex(/^[\d.-]+$/, "El RUC solo puede tener números, puntos y guiones"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type AgentProfileInput = z.infer<typeof agentProfileSchema>;
