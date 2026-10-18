import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateMlsNoticeReceiptPdf } from "@/lib/reports/mlsNoticeReceiptPdf";
import { getPublicStorageUrl } from "@/lib/storage";

const TYPE_LABELS: Record<string, string> = {
  membership_activated: "Membresía MLS activada",
  membership_deactivated: "Membresía MLS inactiva",
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });

  // Defense in depth on top of RLS, same principle as every other plan/
  // ownership gate in this app — re-check recipient_user_id explicitly
  // rather than trusting RLS alone to have filtered it out.
  const { data: notice } = await supabase
    .from("mls_notices")
    .select("id, recipient_user_id, type, title, body, event_at, receipt_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!notice || notice.recipient_user_id !== user.id) {
    return NextResponse.json({ error: "Aviso no encontrado." }, { status: 404 });
  }

  const service = createServiceClient();

  if (notice.receipt_storage_path) {
    return NextResponse.redirect(getPublicStorageUrl("mls-notice-receipts", notice.receipt_storage_path));
  }

  const pdfBytes = await generateMlsNoticeReceiptPdf({
    title: notice.title,
    body: notice.body,
    typeLabel: TYPE_LABELS[notice.type] ?? notice.type,
    eventAt: new Date(notice.event_at),
    referenceId: notice.id,
  });

  const receiptPath = `${notice.id}-comprobante.pdf`;
  const { error: uploadError } = await service.storage
    .from("mls-notice-receipts")
    .upload(receiptPath, pdfBytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) return NextResponse.json({ error: "No se pudo generar el comprobante." }, { status: 500 });

  await service.from("mls_notices").update({ receipt_storage_path: receiptPath }).eq("id", notice.id);

  return NextResponse.redirect(getPublicStorageUrl("mls-notice-receipts", receiptPath));
}
