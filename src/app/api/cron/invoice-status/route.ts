import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { consultarEstadoPorCdc, obtenerKudeBase64 } from "@/lib/billing/facturasend";
import { sendInvoiceEmail } from "@/lib/email/sendInvoiceEmail";

function isAuthorized(request: Request) {
  const bearer = request.headers.get("authorization");
  return bearer === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: pending, error } = await service
    .from("billing_invoices")
    .select("id, cdc")
    .not("cdc", "is", null)
    .eq("invoice_status", "pending");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const record of pending ?? []) {
    if (!record.cdc) continue;
    try {
      const status = await consultarEstadoPorCdc(record.cdc);
      const situacion = status.result.situacion;

      if (situacion === 2 || situacion === 3) {
        let kudeStoragePath: string | null = null;
        try {
          const base64 = await obtenerKudeBase64(record.cdc);
          const path = `${record.id}/kude.pdf`;
          const { error: uploadError } = await service.storage
            .from("invoices")
            .upload(path, Buffer.from(base64, "base64"), { contentType: "application/pdf", upsert: true });
          if (!uploadError) kudeStoragePath = path;
        } catch (kudeErr) {
          console.error(`[invoice-status] KUDE fetch/upload failed for ${record.id}:`, kudeErr);
          // Approval itself still gets recorded below even if the KUDE
          // upload fails — this can be retried independently later.
        }

        await service
          .from("billing_invoices")
          .update({ invoice_status: "approved", kude_storage_path: kudeStoragePath })
          .eq("id", record.id);
        results.push({ id: record.id, status: "approved" });

        const emailResult = await sendInvoiceEmail(record.id);
        await service
          .from("billing_invoices")
          .update(
            emailResult.success
              ? { invoice_email_sent_at: new Date().toISOString(), invoice_email_error: null }
              : { invoice_email_error: emailResult.error }
          )
          .eq("id", record.id);
      } else if (situacion === 4) {
        await service.from("billing_invoices").update({ invoice_status: "rejected" }).eq("id", record.id);
        results.push({ id: record.id, status: "rejected" });
        // Rejections usually need a human to fix data (bad RUC, wrong
        // city code) rather than an automatic retry.
      } else {
        results.push({ id: record.id, status: "still_pending" });
      }
    } catch (err) {
      console.error(`[invoice-status] Status poll failed for record ${record.id}:`, err);
      results.push({ id: record.id, status: "error", error: String(err) });
    }
  }

  return NextResponse.json({ checked: results.length, results });
}
