"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TermsActionState = { error?: string } | undefined;

export async function acceptTerms(): Promise<TermsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const { error } = await supabase
    .from("profiles")
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar. Intentá de nuevo." };

  revalidatePath("/panel");
  revalidatePath("/panel-afiliado");
  return undefined;
}
