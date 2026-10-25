import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendProfilePhotoReminderEmail } from "@/lib/email/sendProfilePhotoReminderEmail";

const REMINDER_DELAY_MS = 60 * 60 * 1000;

function isAuthorized(request: Request) {
  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${process.env.CRON_SECRET}`) return true;

  const legacyHeader = request.headers.get("x-cron-secret");
  return Boolean(legacyHeader && legacyHeader === process.env.CRON_SECRET);
}

// Every 15 min (see vercel.json), catches any agent whose account crossed
// the 1-hour mark since the last run and who still has no avatar_url.
// profile_photo_reminder_sent_at is only set once the email actually sends,
// so a transient Resend failure just gets retried on the next run instead
// of being silently skipped forever — and an agent who adds a photo before
// a retry succeeds naturally drops off the candidate list on its own.
async function runProfilePhotoReminder() {
  const service = createServiceClient();
  const cutoff = new Date(Date.now() - REMINDER_DELAY_MS).toISOString();

  const { data: candidates } = await service
    .from("profiles")
    .select("id, full_name, username")
    .eq("role", "agent")
    .is("avatar_url", null)
    .is("profile_photo_reminder_sent_at", null)
    .lte("created_at", cutoff);

  let sent = 0;

  for (const candidate of candidates ?? []) {
    const { data: userData } = await service.auth.admin.getUserById(candidate.id);
    const email = userData?.user?.email;
    if (!email) continue;

    const result = await sendProfilePhotoReminderEmail({
      to: email,
      fullName: candidate.full_name || candidate.username,
    });
    if (!result.success) continue;

    await service
      .from("profiles")
      .update({ profile_photo_reminder_sent_at: new Date().toISOString() })
      .eq("id", candidate.id);
    sent += 1;
  }

  return { ok: true, candidates: candidates?.length ?? 0, sent };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runProfilePhotoReminder());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runProfilePhotoReminder());
}
