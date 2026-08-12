import { createClient } from "@/lib/supabase/client";

// Calls a Supabase Edge Function with the current session's access token —
// only usable from Client Components (uses the browser Supabase client).
export async function callPagoparFunction<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sesión expirada. Volvé a ingresar.");

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify(body ?? {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "No se pudo conectar con Pagopar. Intentá de nuevo.");
  return data as T;
}
