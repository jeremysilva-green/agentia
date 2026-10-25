import { Resend } from "resend";
import { getSiteUrl } from "@/lib/siteUrl";

function buildProfilePhotoReminderEmailHtml(params: { fullName: string; panelUrl: string }) {
  return `
<div style="font-family: Inter, -apple-system, Helvetica, Arial, sans-serif; color: #0E0E0E; font-size: 15px; line-height: 1.6; max-width: 560px;">
    <p style="margin: 0 0 24px;">
        <img src="https://i.postimg.cc/kgDckwtP/agentia-02.png" alt="Agentia" style="height: 40px; width: auto; display: block;">
    </p>

    <p style="margin: 0 0 16px;">
        Hola <strong>${params.fullName}</strong>,
    </p>

    <p style="margin: 0 0 16px;">
        Tu perfil en <strong style="color: #0A8F5C;">Agentia</strong> todavía no tiene foto. En el portal, quienes buscan agente ven un recuadro vacío donde debería estar tu cara.
    </p>

    <p style="margin: 0 0 24px;">
        Agregarla toma menos de un minuto:
    </p>

    <p style="margin: 0 0 24px;">
        <img src="https://cdxkclxinwdgxqpwrmxa.supabase.co/storage/v1/object/public/profilepic%20gif/agentia-foto-perfil.gif" alt="Animación: en Mi Panel, pestaña Resumen, el cursor sube al recuadro de la foto y hace clic en él" width="560" style="width: 100%; max-width: 560px; height: auto; display: block; border-radius: 10px; border: 1px solid #E5E5E5;">
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px; width: 100%;">
        <tr>
            <td valign="top" style="width: 28px; padding: 0 0 10px; font-weight: 700; color: #0A8F5C;">1.</td>
            <td style="padding: 0 0 10px;">Entrá a <strong>Mi Panel</strong>, en la pestaña <strong>Resumen</strong>.</td>
        </tr>
        <tr>
            <td valign="top" style="width: 28px; padding: 0 0 10px; font-weight: 700; color: #0A8F5C;">2.</td>
            <td style="padding: 0 0 10px;">Hacé clic en el recuadro de tu foto, arriba a la derecha.</td>
        </tr>
        <tr>
            <td valign="top" style="width: 28px; padding: 0; font-weight: 700; color: #0A8F5C;">3.</td>
            <td style="padding: 0;">Subí una foto de frente y con buena luz.</td>
        </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
        <tr>
            <td style="background-color: #0A8F5C; border-radius: 8px;">
                <a href="${params.panelUrl}" style="display: inline-block; padding: 12px 24px; font-family: Inter, -apple-system, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none;">Agregar mi foto</a>
            </td>
        </tr>
    </table>

    <p style="margin: 0 0 24px; padding: 12px 16px; background-color: #F2F8F5; border-left: 3px solid #0A8F5C; border-radius: 4px;">
        ¿Algo no funciona? Escribinos a <strong>info@agentia.com.py</strong> y te ayudamos.
    </p>

    <p style="margin: 24px 0 0; padding-top: 16px; border-top: 1px solid #E5E5E5; font-size: 13px; color: #6B6B6B;">
        Agentia · agentia.com.py
    </p>
</div>`.trim();
}

/**
 * Sent once per agent, ~1 hour after signup, only if they still have no
 * avatar_url by then (see /api/cron/profile-photo-reminder). No-ops (never
 * throws) when RESEND_API_KEY isn't configured, same convention as
 * sendMlsNoticeEmail.ts/sendInvoiceEmail.ts — a missing/misconfigured email
 * provider must never block anything else.
 */
export async function sendProfilePhotoReminderEmail(params: {
  to: string;
  fullName: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[sendProfilePhotoReminderEmail] RESEND_API_KEY not set — skipping email");
    return { success: false, error: "RESEND_API_KEY no configurada" };
  }

  const html = buildProfilePhotoReminderEmailHtml({
    fullName: params.fullName,
    panelUrl: `${getSiteUrl()}/panel`,
  });

  try {
    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: "Agentia <facturacion@agentia.com.py>",
      to: params.to,
      subject: "Agregá tu foto de perfil en Agentia",
      html,
    });

    if (sendError) return { success: false, error: sendError.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
