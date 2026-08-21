import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
  .max(30, "El nombre de usuario debe tener menos de 30 caracteres")
  .regex(/^[a-z0-9_-]+$/, "Solo minúsculas, números, guiones y guiones bajos");

export const loginSchema = z.object({
  email: z.string().email("Ingresá un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const agentSignupSchema = z.object({
  email: z.string().email("Ingresá un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  username: usernameSchema,
  fullName: z.string().min(2, "Ingresá tu nombre completo"),
  phone: z.string().min(6, "Ingresá un teléfono de contacto"),
  city: z.string().min(2, "Ingresá tu ciudad"),
  ruc: z
    .string()
    .min(5, "Ingresá un RUC válido")
    .regex(/^[\d.-]+$/, "El RUC solo puede tener números, puntos y guiones"),
});

export const userSignupSchema = z.object({
  email: z.string().email("Ingresá un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  username: usernameSchema,
  fullName: z.string().min(2, "Ingresá tu nombre completo"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AgentSignupInput = z.infer<typeof agentSignupSchema>;
export type UserSignupInput = z.infer<typeof userSignupSchema>;
