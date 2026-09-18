import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Not specified in the feature spec's own SQL — the monthly reset needs a
// scheduler somewhere. Runs daily (cheap no-op on days nothing is due) and
// resets any row whose cycle has actually elapsed, advancing it exactly one
// month from itself rather than from "today" so a late run doesn't shift
// everyone's cycle.
function isAuthorized(request: Request) {
  const bearer = request.headers.get("authorization");
  return bearer === `Bearer ${process.env.CRON_SECRET}`;
}

async function runAiCreditsReset() {
  const service = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: due } = await service
    .from("agent_ai_credits")
    .select("agent_id, plan_monthly_allowance, cycle_reset_at")
    .lte("cycle_reset_at", today);

  let reset = 0;
  for (const row of due ?? []) {
    const nextReset = new Date(row.cycle_reset_at);
    nextReset.setMonth(nextReset.getMonth() + 1);

    await service
      .from("agent_ai_credits")
      .update({
        credits_remaining: row.plan_monthly_allowance,
        cycle_reset_at: nextReset.toISOString().slice(0, 10),
      })
      .eq("agent_id", row.agent_id);
    reset++;
  }

  return { ok: true, reset };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runAiCreditsReset());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runAiCreditsReset());
}
