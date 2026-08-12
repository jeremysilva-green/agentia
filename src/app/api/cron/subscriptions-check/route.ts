import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

const REMINDER_WINDOW_DAYS = 5;

function isAuthorized(request: Request) {
  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${process.env.CRON_SECRET}`) return true;

  const legacyHeader = request.headers.get("x-cron-secret");
  return Boolean(legacyHeader && legacyHeader === process.env.CRON_SECRET);
}

async function runSubscriptionsCheck() {
  const service = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const reminderCutoff = new Date();
  reminderCutoff.setDate(reminderCutoff.getDate() + REMINDER_WINDOW_DAYS);

  const { data: expiringSoon } = await service
    .from("subscriptions")
    .select("id, agent_id, period_end")
    .eq("status", "active")
    .lte("period_end", reminderCutoff.toISOString().slice(0, 10))
    .gt("period_end", today);

  for (const subscription of expiringSoon ?? []) {
    // Email provider not wired up yet in Phase 1 — this is the hook point for a
    // renewal-reminder email once one is configured (e.g. Resend).
    console.log(`[subscriptions-check] Renewal reminder due for agent ${subscription.agent_id}`);
  }

  const { data: lapsed } = await service
    .from("subscriptions")
    .select("id, agent_id")
    .eq("status", "active")
    .lt("period_end", today);

  for (const subscription of lapsed ?? []) {
    await service.from("subscriptions").update({ status: "past_due" }).eq("id", subscription.id);
    await service.from("agent_profiles").update({ is_active: false }).eq("id", subscription.agent_id);
  }

  return {
    ok: true,
    remindersLogged: expiringSoon?.length ?? 0,
    lapsed: lapsed?.length ?? 0,
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runSubscriptionsCheck());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runSubscriptionsCheck());
}
