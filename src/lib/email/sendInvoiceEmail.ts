import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { getPublicStorageUrl } from "@/lib/storage";
import { PLANS, isPlanId } from "@/lib/plans";

const INK = "#0E0E0E";
const GREEN = "#0A8F5C";

function buildInvoiceEmailHtml(params: {
  agentName: string;
  planName: string;
  amount: number;
  currency: string;
  invoiceNumber: number | null;
  kudeUrl: string | null;
}) {
  const amountFormatted = new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: params.currency,
    maximumFractionDigits: 0,
  }).format(params.amount);

  return `
<div style="font-family: Inter, -apple-system, sans-serif; background: #f4f4f5; padding: 32px 16px;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden;">
    <div style="background: ${INK}; padding: 24px 32px;">
      <span style="font-family: 'Clash Display', Inter, sans-serif; font-weight: 600; font-size: 20px; color: #ffffff;">Agentia</span>
    </div>
    <div style="padding: 32px;">
      <h1 style="font-family: 'Clash Display', Inter, sans-serif; font-size: 20px; color: ${INK}; margin: 0 0 16px;">
        Tu factura está lista
      </h1>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 16px;">
        Hola ${params.agentName}, generamos tu factura electrónica${params.invoiceNumber ? ` #${params.invoiceNumber}` : ""}
        por el Plan ${params.planName} — ${amountFormatted}.
      </p>
      ${
        params.kudeUrl
          ? `<a href="${params.kudeUrl}" style="display: inline-block; background: ${GREEN}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 10px;">Ver factura (PDF)</a>`
          : `<p style="font-size: 13px; color: #6b7280;">La factura en PDF estará disponible en breve.</p>`
      }
    </div>
  </div>
</div>`.trim();
}

/**
 * Fires when a billing_invoices row's status flips to "approved" (called
 * directly from /api/cron/invoice-status, which already owns that
 * detection point natively — no separate DB webhook needed).
 *
 * No-ops (logs + returns success:false with a reason) rather than throwing
 * when RESEND_API_KEY isn't configured yet, matching how this codebase
 * already handles other not-yet-provisioned external services.
 */
export async function sendInvoiceEmail(
  billingInvoiceId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[sendInvoiceEmail] RESEND_API_KEY not set — skipping email for ${billingInvoiceId}`);
    return { success: false, error: "RESEND_API_KEY no configurada" };
  }

  const service = createServiceClient();

  const { data: invoice, error: invoiceError } = await service
    .from("billing_invoices")
    .select("id, agent_id, invoice_number, kude_storage_path, payments(plan, amount, currency)")
    .eq("id", billingInvoiceId)
    .single();

  if (invoiceError || !invoice) {
    return { success: false, error: invoiceError?.message ?? "Factura no encontrada" };
  }

  const { data: authUser, error: authError } = await service.auth.admin.getUserById(invoice.agent_id);
  const email = authUser?.user?.email;
  if (authError || !email) {
    return { success: false, error: authError?.message ?? "El agente no tiene un email registrado" };
  }

  const { data: profile } = await service.from("profiles").select("full_name").eq("id", invoice.agent_id).single();

  const payment = invoice.payments as unknown as { plan: string; amount: number; currency: string } | null;
  const planName = payment?.plan && isPlanId(payment.plan) ? PLANS[payment.plan].name : (payment?.plan ?? "");

  const kudeUrl = invoice.kude_storage_path ? getPublicStorageUrl("invoices", invoice.kude_storage_path) : null;

  const html = buildInvoiceEmailHtml({
    agentName: profile?.full_name ?? "agente",
    planName,
    amount: payment?.amount ?? 0,
    currency: payment?.currency ?? "PYG",
    invoiceNumber: invoice.invoice_number,
    kudeUrl,
  });

  try {
    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: "Agentia <facturacion@agentia.com.py>",
      to: email,
      subject: "Tu factura de Agentia está lista",
      html,
    });

    if (sendError) return { success: false, error: sendError.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
