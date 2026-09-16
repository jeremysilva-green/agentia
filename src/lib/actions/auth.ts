"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { agentSignupSchema, forgotPasswordSchema, loginSchema, newPasswordSchema, userSignupSchema } from "@/lib/validations/auth";
import { fieldErrorsFrom } from "@/lib/formErrors";
import { getSiteUrl } from "@/lib/siteUrl";

export type ActionState = { error?: string; fieldErrors?: Record<string, string>; success?: boolean } | undefined;

function firstIssueMessage(issues: { message: string }[]) {
  return issues[0]?.message ?? "Datos inválidos";
}

// Supabase Auth's own rate-limit throttle on signUp() returns this exact
// English message (e.g. after a double form submit) — translate it instead
// of leaking raw English into an otherwise all-Spanish app.
function translateAuthError(message: string): string {
  const match = message.match(/you can only request this after (\d+) seconds/i);
  if (match) return `Por seguridad, podés intentarlo de nuevo en ${match[1]} segundos.`;
  return message;
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
  const siteUrl = getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });
  if (error) return { error: translateAuthError(error.message) };
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

  // Supabase's "Confirm signup" email still goes out as usual (it's been
  // re-worded in the dashboard to read as a welcome/"activate your account"
  // email, not a blocking gate) — but the agent doesn't have to wait for it:
  // confirm the account server-side immediately and sign them straight in.
  // Clicking the email link is now optional, not required for access.
  await service.auth.admin.updateUserById(data.user.id, { email_confirm: true });
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (!signInError) {
    redirect("/agentes");
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
  const siteUrl = getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });
  if (error) return { error: translateAuthError(error.message) };
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

  // Same reasoning as signUpAgent: confirm + sign in immediately server-side
  // so the affiliate doesn't have to wait on the welcome email.
  await service.auth.admin.updateUserById(data.user.id, { email_confirm: true });
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (!signInError) {
    redirect("/agentes");
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

export async function requestPasswordReset(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error.issues), fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  // Never reveals whether the email actually has an account — Supabase
  // itself already behaves this way (resetPasswordForEmail succeeds
  // silently for an unknown address), so the generic success message here
  // doesn't leak anything an attacker couldn't already infer.
  //
  // Points straight at /restablecer-contrasena (which exchanges its own
  // ?code= param — see that page) rather than routing through
  // /auth/callback?next=..., since Supabase's Redirect URLs allowlist
  // currently has exactly one bare entry (no query string) and it's
  // unverified whether it matches with one appended. A bare URL here
  // mirrors that exact proven pattern instead of gambling on it.
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/restablecer-contrasena`,
  });
  if (error) return { error: translateAuthError(error.message) };

  return { success: true };
}

export async function updatePassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error.issues), fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createClient();

  // The recovery code is exchanged here rather than in the page's Server
  // Component render — Next.js Server Components cannot set cookies, so
  // doing it there looked like it worked (the in-memory session was fine
  // for that one render) but never actually persisted a session, and this
  // exact form submission failed with "El enlace expiró" every time.
  // Server Actions can set cookies, so the exchange belongs here instead.
  const code = formData.get("code");
  if (typeof code === "string" && code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return { error: "El enlace expiró o ya fue usado. Solicitá uno nuevo desde Ingresar." };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "El enlace expiró o ya fue usado. Solicitá uno nuevo desde Ingresar." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: translateAuthError(error.message) };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  redirect(profile?.role === "agent" ? "/panel" : "/panel-afiliado");
}
