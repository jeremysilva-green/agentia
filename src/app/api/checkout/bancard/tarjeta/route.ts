import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createCardTokenRequest } from "@/lib/bancard";

// Initiates a direct-Bancard card tokenization request — returns a
// process_id ("resultado") for the client to feed into Bancard's own
// Cards.createForm iframe widget. The actual token confirmation happens via
// the webhook (see /api/webhooks/bancard), not a client-driven confirm call,
// since that's the mechanism already proven for one-time purchases.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "agent") {
    return NextResponse.json({ error: "Solo los agentes pueden guardar una tarjeta" }, { status: 403 });
  }

  const service = createServiceClient();

  const { data: subscription } = await service
    .from("subscriptions")
    .select("id")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!subscription) {
    return NextResponse.json({ error: "No se encontró la suscripción del agente" }, { status: 404 });
  }

  const { data: shopProcessId } = await service.rpc("next_shop_process_id");
  if (!shopProcessId) {
    return NextResponse.json({ error: "No se pudo generar el identificador de catastro" }, { status: 500 });
  }

  const { error: paymentError } = await service.from("payments").insert({
    subscription_id: subscription.id,
    bancard_shop_process_id: String(shopProcessId),
    bancard_tipo: "tarjeta",
    amount: 0,
    currency: "PYG",
    status: "initiated",
  });
  if (paymentError) {
    return NextResponse.json({ error: "No se pudo iniciar el catastro de tarjeta" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const { processId } = await createCardTokenRequest({
      shopProcessId,
      returnUrl: `${siteUrl}/panel/suscripcion/tarjeta/resultado`,
    });

    await service.from("payments").update({ bancard_process_id: processId }).eq("bancard_shop_process_id", String(shopProcessId));

    await service.from("agent_profiles").update({ proveedor_tarjeta: "Bancard" }).eq("id", user.id);

    return NextResponse.json({ resultado: processId });
  } catch {
    await service.from("payments").update({ status: "error" }).eq("bancard_shop_process_id", String(shopProcessId));
    return NextResponse.json({ error: "No se pudo conectar con Bancard. Intentá de nuevo." }, { status: 502 });
  }
}
