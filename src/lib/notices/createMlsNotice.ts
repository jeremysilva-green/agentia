import { createServiceClient } from "@/lib/supabase/service";
import { sendMlsNoticeEmail } from "@/lib/email/sendMlsNoticeEmail";
import { generateMlsNoticeReceiptPdf } from "@/lib/reports/mlsNoticeReceiptPdf";
import { MLS_NOTICE_TYPE_LABELS } from "@/lib/notices/typeLabels";
import type { Database } from "@/types/database.types";

type MlsNoticeType = Database["public"]["Tables"]["mls_notices"]["Row"]["type"];

// The single server-side function the MLS spec requires: every MLS state
// change that needs to notify an agent calls this, instead of inserting
// into mls_notices directly from scattered call sites. Always runs with the
// service-role client — mls_notices has no client-facing insert policy, by
// design (see 0068_mls_notices.sql).
export async function createMlsNotice(params: {
  recipientUserId: string;
  type: MlsNoticeType;
  title: string;
  body: string;
  eventAt: Date;
  listingId?: string;
}): Promise<{ noticeId: string } | { error: string }> {
  const service = createServiceClient();

  const { data: notice, error: insertError } = await service
    .from("mls_notices")
    .insert({
      recipient_user_id: params.recipientUserId,
      type: params.type,
      title: params.title,
      body: params.body,
      event_at: params.eventAt.toISOString(),
      listing_id: params.listingId ?? null,
    })
    .select("id")
    .single();

  if (insertError || !notice) {
    return { error: insertError?.message ?? "No se pudo crear el aviso." };
  }

  // Email is best-effort — the in-app Aviso existing is the primary
  // guarantee, so a delivery failure here never fails the caller. Tracked
  // on the row itself so failures stay visible rather than silently lost,
  // same pattern as billing_invoices' invoice_email_sent_at/error.
  const { data: authUser } = await service.auth.admin.getUserById(params.recipientUserId);
  const email = authUser?.user?.email;

  if (email) {
    // The receipt PDF travels with the email. It's also stored (same path the
    // "Descargar comprobante" button uses) so the panel link reuses it; a
    // failure on either step just sends the email without the attachment.
    let receipt: { filename: string; content: Uint8Array } | undefined;
    try {
      const pdfBytes = await generateMlsNoticeReceiptPdf({
        title: params.title,
        body: params.body,
        typeLabel: MLS_NOTICE_TYPE_LABELS[params.type] ?? params.type,
        eventAt: params.eventAt,
        referenceId: notice.id,
      });
      receipt = { filename: "comprobante-aviso-agentia.pdf", content: pdfBytes };

      const receiptPath = `${notice.id}-comprobante.pdf`;
      const { error: uploadError } = await service.storage
        .from("mls-notice-receipts")
        .upload(receiptPath, pdfBytes, { contentType: "application/pdf", upsert: true });
      if (!uploadError) await service.from("mls_notices").update({ receipt_storage_path: receiptPath }).eq("id", notice.id);
    } catch (err) {
      console.error("[createMlsNotice] receipt PDF failed, emailing without it", err);
    }

    const result = await sendMlsNoticeEmail({
      to: email,
      title: params.title,
      body: params.body,
      eventAt: params.eventAt,
      receipt,
    });
    await service
      .from("mls_notices")
      .update(
        result.success
          ? { email_sent_at: new Date().toISOString() }
          : { email_error: result.error }
      )
      .eq("id", notice.id);
  } else {
    await service.from("mls_notices").update({ email_error: "El agente no tiene un email registrado" }).eq("id", notice.id);
  }

  return { noticeId: notice.id };
}
