import { z } from "zod";

export const profileSchema = z.object({
  alias: z.string().max(60, "El alias es muy largo").optional().or(z.literal("")),
  phone: z.string().min(6, "Ingresá un teléfono de contacto").optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
