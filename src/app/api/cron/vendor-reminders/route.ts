import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateVendorReportPdf } from "@/lib/reports/vendorReport";

const REMINDER_INTERVAL_DAYS = 15;

function isAuthorized(request: Request) {
  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${process.env.CRON_SECRET}`) return true;

  const legacyHeader = request.headers.get("x-cron-secret");
  return Boolean(legacyHeader && legacyHeader === process.env.CRON_SECRET);
}

async function runVendorReminders() {
  const service = createServiceClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REMINDER_INTERVAL_DAYS);

  const { data: candidates } = await service
    .from("client_requests")
    .select("id, full_name, phone, city, resulting_property_id, last_reminder_at, updated_at")
    .eq("kind", "vendedor")
    .eq("status", "approved")
    .not("resulting_property_id", "is", null);

  let reportsGenerated = 0;

  for (const request of candidates ?? []) {
    const lastReminderAt = request.last_reminder_at ? new Date(request.last_reminder_at) : null;
    const dueAt = lastReminderAt ?? new Date(request.updated_at);
    if (dueAt > cutoff) continue;

    const { data: property } = await service
      .from("properties")
      .select("id, title, status, created_at")
      .eq("id", request.resulting_property_id as string)
      .single();

    if (!property || property.status === "sold") continue;

    const periodStart = lastReminderAt ?? new Date(property.created_at);
    const periodEnd = new Date();

    const [{ count: viewCount }, { count: leadCount }] = await Promise.all([
      service
        .from("lead_events")
        .select("id", { count: "exact", head: true })
        .eq("property_id", property.id)
        .eq("event_type", "view"),
      service.from("leads").select("id", { count: "exact", head: true }).eq("property_id", property.id),
    ]);

    const pdfBytes = await generateVendorReportPdf({
      sellerName: request.full_name,
      propertyTitle: property.title,
      city: request.city,
      periodStart,
      periodEnd,
      viewCount: viewCount ?? 0,
      leadCount: leadCount ?? 0,
      generatedAt: periodEnd,
    });

    const reportPath = `${request.id}/${periodEnd.getTime()}.pdf`;
    const { error: uploadError } = await service.storage.from("vendor-reports").upload(reportPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploadError) continue;

    await service
      .from("client_requests")
      .update({ last_report_path: reportPath, last_reminder_at: periodEnd.toISOString() })
      .eq("id", request.id);

    reportsGenerated += 1;
  }

  return { ok: true, candidates: candidates?.length ?? 0, reportsGenerated };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runVendorReminders());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runVendorReminders());
}
