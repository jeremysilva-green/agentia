import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const DAILY_CAP = 20;
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB server-side ceiling, well under OpenAI's 50MB limit
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

// gpt-image pricing, per the feature spec — used to compute a real cost_usd
// from OpenAI's own usage numbers rather than estimating.
const PRICE_PER_MILLION = { imageInput: 8, textInput: 5, output: 30 };

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

  const service = createServiceClient();

  // Server-side plan gate — never trust the page-level redirect alone.
  const { data: subscription } = await service
    .from("subscriptions")
    .select("plan")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subscription?.plan !== "pro" && subscription?.plan !== "fundador") {
    return NextResponse.json({ error: "Esta función está disponible para planes Pro y Fundador." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Formato no soportado. Usá PNG, JPEG o WEBP." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "La imagen es demasiado pesada." }, { status: 400 });
  }

  // Checked before touching credits at all — testing this path (or a real
  // user hitting it before the key is provisioned) never costs a credit.
  // Matches the same no-op-gracefully pattern already used for
  // RESEND_API_KEY in sendInvoiceEmail.ts.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[ai-enhance] OPENAI_API_KEY not set — rejecting request without charging a credit");
    return NextResponse.json({ error: "Este servicio todavía no está disponible. Probá más tarde." }, { status: 503 });
  }

  const enhancementType = "standard";

  const { count: todayCount } = await service
    .from("enhancement_jobs")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", user.id)
    .neq("status", "failed")
    .gte("created_at", new Date().toISOString().slice(0, 10));
  if ((todayCount ?? 0) >= DAILY_CAP) {
    return NextResponse.json({ error: "Alcanzaste el límite diario de mejoras. Probá de nuevo mañana." }, { status: 429 });
  }

  const { data: charged } = await service.rpc("try_charge_ai_credit", { p_agent_id: user.id });
  if (!charged) {
    return NextResponse.json({ error: "No te quedan créditos este mes." }, { status: 402 });
  }

  const { data: template } = await service
    .from("enhancement_prompt_templates")
    .select("prompt_template")
    .eq("enhancement_type", enhancementType)
    .eq("active", true)
    .single();

  if (!template) {
    await service.rpc("refund_ai_credit", { p_agent_id: user.id });
    return NextResponse.json({ error: "No se pudo cargar la configuración. Intentá de nuevo." }, { status: 500 });
  }

  try {
    const openaiForm = new FormData();
    openaiForm.set("model", "gpt-image-2.5-flare");
    openaiForm.set("image", file);
    openaiForm.set("prompt", template.prompt_template);
    openaiForm.set("quality", "medium");
    openaiForm.set("size", "auto");

    const openaiResponse = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openaiForm,
    });

    const result = await openaiResponse.json().catch(() => null);

    if (!openaiResponse.ok || !result?.data?.[0]?.b64_json) {
      throw new Error(result?.error?.message ?? `OpenAI request failed (${openaiResponse.status})`);
    }

    const usage = result.usage ?? {};
    const imageTokens = usage.input_tokens_details?.image_tokens ?? 0;
    const textTokens = usage.input_tokens_details?.text_tokens ?? 0;
    const outputTokens = usage.output_tokens ?? 0;
    const costUsd =
      (imageTokens / 1_000_000) * PRICE_PER_MILLION.imageInput +
      (textTokens / 1_000_000) * PRICE_PER_MILLION.textInput +
      (outputTokens / 1_000_000) * PRICE_PER_MILLION.output;

    await service.from("enhancement_jobs").insert({
      agent_id: user.id,
      enhancement_type: enhancementType,
      status: "completed",
      input_tokens: usage.input_tokens ?? null,
      output_tokens: outputTokens || null,
      cost_usd: costUsd,
    });

    // The base64 image is forwarded straight through and never written to
    // Storage, disk, or logs anywhere in this route.
    return NextResponse.json({ imageBase64: result.data[0].b64_json });
  } catch (err) {
    console.error("[ai-enhance] generation failed:", err);
    await service.rpc("refund_ai_credit", { p_agent_id: user.id });
    await service.from("enhancement_jobs").insert({
      agent_id: user.id,
      enhancement_type: enhancementType,
      status: "failed",
      credit_charged: false,
    });
    return NextResponse.json({ error: "No se pudo generar la imagen. Probá de nuevo." }, { status: 502 });
  }
}
