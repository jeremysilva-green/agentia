import { Resend } from "resend";
import { getSiteUrl } from "@/lib/siteUrl";

const INK = "#0E0E0E";
const GREEN = "#0A8F5C";

function buildMlsNoticeEmailHtml(params: { title: string; body: string; eventAt: Date; avisosUrl: string }) {
  const eventAtFormatted = params.eventAt.toLocaleString("es-PY", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return `
<div style="font-family: Inter, -apple-system, sans-serif; background: #f4f4f5; padding: 32px 16px;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden;">
    <div style="background: ${INK}; padding: 24px 32px;">
      <span style="font-family: 'Clash Display', Inter, sans-serif; font-weight: 600; font-size: 20px; color: #ffffff;">Agentia MLS</span>
    </div>
    <div style="padding: 32px;">
      <h1 style="font-family: 'Clash Display', Inter, sans-serif; font-size: 20px; color: ${INK}; margin: 0 0 16px;">
        ${params.title}
      </h1>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 8px;">${params.body}</p>
      <p style="font-size: 12px; color: #9ca3af; margin: 0 0 20px;">${eventAtFormatted}</p>
      <a href="${params.avisosUrl}" style="display: inline-block; background: ${GREEN}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 10px;">Ver en Agentia</a>
    </div>
  </div>
</div>`.trim();
}

/**
 * Called directly from createMlsNotice() right after the notice row is
 * inserted — never a DB trigger/webhook, same convention as
 * sendInvoiceEmail.ts. No-ops (never throws) when RESEND_API_KEY isn't
 * configured, so a missing/misconfigured email provider can never block the
 * in-app Aviso from existing — that's the primary guarantee, this is
 * best-effort.
 */
export async function sendMlsNoticeEmail(params: {
  to: string;
  title: string;
  body: string;
  eventAt: Date;
}): Promise<{ success: true } | { success: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[sendMlsNoticeEmail] RESEND_API_KEY not set — skipping email "${params.title}"`);
    return { success: false, error: "RESEND_API_KEY no configurada" };
  }

  const html = buildMlsNoticeEmailHtml({
    title: params.title,
    body: params.body,
    eventAt: params.eventAt,
    avisosUrl: `${getSiteUrl()}/panel/avisos`,
  });

  try {
    // Reuses the already-verified facturacion@ sender — a dedicated
    // avisos@agentia.com.py address needs its own Resend domain
    // verification before swapping this in.
    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: "Agentia <facturacion@agentia.com.py>",
      to: params.to,
      subject: params.title,
      html,
    });

    if (sendError) return { success: false, error: sendError.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
