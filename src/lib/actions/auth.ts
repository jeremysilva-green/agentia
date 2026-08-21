"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { agentSignupSchema, loginSchema, userSignupSchema } from "@/lib/validations/auth";
import { fieldErrorsFrom } from "@/lib/formErrors";

export type ActionState = { error?: string; fieldErrors?: Record<string, string>; success?: boolean } | undefined;

function firstIssueMessage(issues: { message: string }[]) {
  return issues[0]?.message ?? "Datos inválidos";
}

export async function signUpAgent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = agentSignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    ruc: formData.get("ruc"),
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error.issues), fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const { email, password, username, fullName, phone, city, ruc } = parsed.data;
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: "No se pudo crear la cuenta. Intentá de nuevo." };

  const service = createServiceClient();

  const { error: profileError } = await service.from("profiles").insert({
    id: data.user.id,
    role: "agent",
    username,
    full_name: fullName,
    phone,
  });
  if (profileError) {
    return {
      error: profileError.code === "23505"
        ? "Ese nombre de usuario ya está en uso."
        : "No se pudo completar el registro. Intentá de nuevo.",
    };
  }

  // Agents start free on Básico: full access (including public listing)
  // right away, no card and no trial clock — they can stay on this plan
  // indefinitely or upgrade to Pro/Fundador anytime from the panel.
  const { error: agentProfileError } = await service.from("agent_profiles").insert({
    id: data.user.id,
    slug: username,
    city,
    ruc,
    is_active: true,
  });
  if (agentProfileError) {
    return { error: "No se pudo completar el registro. Intentá de nuevo." };
  }

  const { error: subscriptionError } = await service.from("subscriptions").insert({
    agent_id: data.user.id,
    status: "active",
    plan: "basico",
  });
  if (subscriptionError) {
    return { error: "No se pudo completar el registro. Intentá de nuevo." };
  }

  return { success: true };
}

export async function signUpUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = userSignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    username: formData.get("username"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error.issues), fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const { email, password, username, fullName } = parsed.data;
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: "No se pudo crear la cuenta. Intentá de nuevo." };

  const service = createServiceClient();
  const { error: profileError } = await service.from("profiles").insert({
    id: data.user.id,
    role: "user",
    username,
    full_name: fullName,
  });
  if (profileError) {
    return {
      error: profileError.code === "23505"
        ? "Ese nombre de usuario ya está en uso."
        : "No se pudo completar el registro. Intentá de nuevo.",
    };
  }

  return { success: true };
}

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error.issues), fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Correo o contraseña incorrectos." };

  const next = formData.get("next");
  if (typeof next === "string" && next.startsWith("/")) {
    redirect(next);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(profile?.role === "agent" ? "/panel" : "/panel-afiliado");
}
