import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createSingleBuy, buildBancardPaymentUrl } from "@/lib/bancard";
import { PLANS, isPlanId } from "@/lib/plans";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const planId = body?.plan;

  if (!isPlanId(planId)) {
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
    .select("*")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    return NextResponse.json({ error: "No se encontró la suscripción del agente" }, { status: 404 });
  }

  const { data: shopProcessId } = await service.rpc("next_shop_process_id");
  if (!shopProcessId) {
    return NextResponse.json({ error: "No se pudo generar el identificador de pago" }, { status: 500 });
  }

  // Amount always comes from the server-side plan table — never trust a
  // client-supplied price for a payment.
  const plan = PLANS[planId];

  const { data: payment, error: paymentError } = await service
    .from("payments")
    .insert({
      subscription_id: subscription.id,
      bancard_shop_process_id: String(shopProcessId),
      amount: plan.price,
      currency: "PYG",
      plan: plan.id,
      status: "initiated",
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const { processId } = await createSingleBuy({
      shopProcessId,
      amount: plan.price,
      description: `Suscripción Agently — Plan ${plan.name}`,
      returnUrl: `${siteUrl}/panel/suscripcion?resultado=retorno`,
    });

    await service.from("payments").update({ bancard_process_id: processId }).eq("id", payment.id);

    return NextResponse.json({ redirectUrl: buildBancardPaymentUrl(processId) });
  } catch {
    await service.from("payments").update({ status: "error" }).eq("id", payment.id);
    return NextResponse.json({ error: "No se pudo conectar con Bancard. Intentá de nuevo." }, { status: 502 });
  }
}
