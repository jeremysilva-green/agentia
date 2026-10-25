import { Resend } from "resend";
import { getSiteUrl } from "@/lib/siteUrl";

// Header/card structure matches the invite-user email template exactly
// (dark #0E0E0E header bar, centered logo, green accent bar, white rounded
// card on a light page background) — the logo artwork is light-colored,
// made for that dark bar, which is why it was invisible sitting directly on
// our old plain white background.
function buildProfilePhotoReminderEmailHtml(params: { fullName: string; panelUrl: string; logoUrl: string }) {
  return `
<div style="margin:0; padding:0; background-color:#F4F5F7; width:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F5F7; padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#FFFFFF; border-radius:12px; overflow:hidden;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="background-color:#0E0E0E; padding:32px 40px;">
              <img src="${params.logoUrl}" alt="Agentia" width="140" style="display:block; width:140px; height:auto; border:0;">
            </td>
          </tr>

          <!-- Green accent bar -->
          <tr>
            <td style="background-color:#0A8F5C; height:4px; line-height:4px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px 40px; font-family: Inter, -apple-system, Helvetica, Arial, sans-serif; color:#0E0E0E; font-size:15px; line-height:1.6;">
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
                  <img src="https://cdxkclxinwdgxqpwrmxa.supabase.co/storage/v1/object/public/profilepic%20gif/agentia-foto-perfil.gif" alt="Animación: en Mi Panel, pestaña Resumen, el cursor sube al recuadro de la foto y hace clic en él" width="520" style="width: 100%; max-width: 520px; height: auto; display: block; border-radius: 10px; border: 1px solid #E5E5E5;">
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
                          <a href="${params.panelUrl}" style="display: inline-block; padding: 14px 32px; font-family: Inter, -apple-system, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 8px;">Agregar mi foto</a>
                      </td>
                  </tr>
              </table>

              <p style="margin: 0; padding: 12px 16px; background-color: #F2F8F5; border-left: 3px solid #0A8F5C; border-radius: 4px; font-size: 14px;">
                  ¿Algo no funciona? Escribinos a <strong>info@agentia.com.py</strong> y te ayudamos.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="border-top:1px solid #E6F4ED; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px 40px; font-family: Inter, -apple-system, Helvetica, Arial, sans-serif;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#6B7280;">
                © Agentia · agentia.com.py
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
    // Same Supabase storage asset used by the invite-user email template,
    // not the site's own /public — the earlier postimg.cc host was getting
    // silently blocked by Gmail's image proxy.
    logoUrl: "https://cdxkclxinwdgxqpwrmxa.supabase.co/storage/v1/object/public/brand-assets/agentia-04.png",
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
