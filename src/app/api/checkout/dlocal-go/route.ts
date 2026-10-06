import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buildSubscribeUrl } from "@/lib/dlocalGo";
import { isPlanId } from "@/lib/plans";

// Pro and Fundador are dLocal Go subscriptions: the agent is sent to the
// plan's subscribe link, dLocal bills monthly from then on, and
// syncDlocalGoSubscriptions records each charge. Básico is never charged.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const planId = body?.plan;

  if (!isPlanId(planId) || planId === "basico") {
    return NextResponse.json({ error: "Elegí un plan válido" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "agent") {
    return NextResponse.json({ error: "Solo los agentes pueden pagar la suscripción" }, { status: 403 });
  }

  const service = createServiceClient();

  const { data: subscription } = await service
    .from("subscriptions")
    .select("id, dlocal_go_subscription_id")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    return NextResponse.json({ error: "No se encontró la suscripción del agente" }, { status: 404 });
  }

  if (subscription.dlocal_go_subscription_id) {
    return NextResponse.json({ error: "Cancelá tu plan actual antes de cambiar a otro plan pago." }, { status: 409 });
  }

  await service.from("subscriptions").update({ plan: planId, status: "pending" }).eq("id", subscription.id);

  return NextResponse.json({ redirectUrl: buildSubscribeUrl(planId, user.id) });
}
