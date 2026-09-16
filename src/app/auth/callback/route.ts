import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  // Must be a same-site relative path — an unvalidated next param here is
  // an open redirect (a crafted ?next=https://evil.com would send an
  // authenticated user's browser off-site right after this exchange).
  const next = rawNext && rawNext.startsWith("/") ? rawNext : "/ingresar";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
