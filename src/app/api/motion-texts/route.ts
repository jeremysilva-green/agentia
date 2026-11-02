import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { hasActiveProAccess, BASICO_FREE_MOTION_TRIES } from "@/lib/plans";

// The Textos Dinámicos tool runs entirely in the browser, so this route is
// its only server-side checkpoint: "start" (called right before a video is
// generated) charges a free try for non-paid agents, "failed" gives it back.
// Paid plans (Pro / Fundador / MLS) are unlimited and never charged.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "agent") {
    return NextResponse.json({ error: "Solo los agentes pueden usar esta función." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (action !== "start" && action !== "failed") {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: subscription } = await service
    .from("subscriptions")
    .select("plan, status")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (hasActiveProAccess(subscription)) return NextResponse.json({ ok: true, unlimited: true });

  if (action === "failed") {
    await service.rpc("refund_free_motion", { p_agent_id: user.id });
  } else {
    const { data: charged } = await service.rpc("try_charge_free_motion", {
      p_agent_id: user.id,
      p_limit: BASICO_FREE_MOTION_TRIES,
    });
    if (!charged) {
      return NextResponse.json(
        { error: "Usaste tus videos gratis. Actualizá tu plan para seguir.", code: "free_limit" },
        { status: 402 }
      );
    }
  }

  const { data: credits } = await service
    .from("agent_ai_credits")
    .select("free_motion_tries_used")
    .eq("agent_id", user.id)
    .maybeSingle();
  return NextResponse.json({
    ok: true,
    remaining: Math.max(0, BASICO_FREE_MOTION_TRIES - (credits?.free_motion_tries_used ?? 0)),
  });
}
