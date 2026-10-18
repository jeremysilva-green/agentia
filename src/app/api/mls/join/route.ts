import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasActiveMlsAccess } from "@/lib/plans";
import { createMlsNotice } from "@/lib/notices/createMlsNotice";

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

// "Unirme al MLS" — a Route Handler rather than a Server Action because it
// needs real request headers (the agent's IP, for mls_rule_acceptances),
// same reasoning other things-needing-real-request-context in this app use
// a route over an action.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const ci = typeof body?.ci === "string" ? body.ci.trim() : "";
  const agencyName = typeof body?.agencyName === "string" ? body.agencyName.trim() : "";

  if (!ci) {
    return NextResponse.json({ error: "Ingresá tu cédula de identidad." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión expirada. Volvé a ingresar." }, { status: 401 });

  // Never trust a page-level gate alone — re-check Plan MLS server-side,
  // same principle as /api/ai-enhance.
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!hasActiveMlsAccess(subscription)) {
    return NextResponse.json({ error: "El MLS es parte del Plan MLS." }, { status: 403 });
  }

  const { data: currentRuleVersion } = await supabase
    .from("mls_rule_versions")
    .select("id")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!currentRuleVersion) {
    return NextResponse.json({ error: "No hay un Reglamento MLS publicado todavía." }, { status: 500 });
  }

  const { data: membershipId, error: joinError } = await supabase.rpc("join_mls", {
    p_ci: ci,
    p_agency_name: agencyName || null,
    p_rule_version_id: currentRuleVersion.id,
    p_ip: getClientIp(request),
  });

  if (joinError || !membershipId) {
    return NextResponse.json({ error: joinError?.message ?? "No se pudo completar la membresía." }, { status: 400 });
  }

  await createMlsNotice({
    recipientUserId: user.id,
    type: "membership_activated",
    title: "Ya sos miembro del MLS",
    body: "Tu membresía del MLS está activa. Ya podés acceder a la red de cooperación entre agentes.",
    eventAt: new Date(),
  });

  return NextResponse.json({ ok: true, membershipId });
}
