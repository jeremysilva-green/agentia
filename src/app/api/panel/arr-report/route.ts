import { PDFDocument } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { getArrStats, getArrEligibility } from "@/lib/data/vistaGlobal";
import { loadReportAssets, drawHeaderBand, drawFooter, createReportCursor, HEADER_HEIGHT } from "@/lib/reports/pdfChrome";

function formatPYG(amount: number) {
  return `Gs. ${amount.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, full_name, username").eq("id", user.id).single();
  if (profile?.role !== "agent") return new Response("No autorizado", { status: 403 });

  // Re-check eligibility server-side — the button is only hidden/disabled
  // client-side, so a direct request must not bypass the one-year gate.
  const eligibility = await getArrEligibility(user.id);
  if (!eligibility.eligible) {
    return new Response("Todavía no pasó un año desde que te registraste.", { status: 403 });
  }

  const stats = await getArrStats(user.id);
  const agentName = profile.full_name || profile.username || "Agente";

  const pdfDoc = await PDFDocument.create();
  const { font, bold, logoImage } = await loadReportAssets(pdfDoc);
  const pageWidth = 595;
  const pageHeight = 780;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  drawHeaderBand(page, pageWidth, pageHeight, font, logoImage, "Reporte Anual");

  const rangeLabel = `${stats.rangeStart.toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" })} — ${stats.rangeEnd.toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" })}`;
  const cursor = createReportCursor(page, pageWidth, pageHeight - HEADER_HEIGHT - 45, font, bold);
  cursor.line(agentName, 18, true);
  cursor.line(`Últimos 12 meses · ${rangeLabel}`, 11, false);

  cursor.section("Total facturado");
  cursor.row("Ventas cerradas (Gs.)", formatPYG(stats.salesPYG));
  if (stats.salesUSD > 0) cursor.row("Ventas cerradas (USD)", `USD ${stats.salesUSD.toLocaleString("es-PY")}`);

  cursor.section("Tráfico");
  cursor.row("Clics en tu portafolio", stats.portfolioClicks.toLocaleString("es-PY"));
  cursor.row("Clics en propiedades", stats.propertyClicks.toLocaleString("es-PY"));
  cursor.row("Clics en enlaces de afiliados", stats.affiliateLinkClicks.toLocaleString("es-PY"));

  cursor.section("Actividad");
  cursor.row("Leads generados", stats.leads.toLocaleString("es-PY"));
  cursor.row("Solicitudes recibidas", (stats.solicitudesVendedor + stats.solicitudesComprador).toLocaleString("es-PY"));
  cursor.subRow(`${stats.solicitudesVendedor} Cliente Vendedor · ${stats.solicitudesComprador} Cliente Comprador`);
  cursor.row("Conversaciones de chat iniciadas", stats.conversations.toLocaleString("es-PY"));
  cursor.row("Visitas agendadas", stats.agendamientos.toLocaleString("es-PY"));

  cursor.section("Propiedades y acuerdos");
  cursor.row("Propiedades totales", stats.totalProperties.toLocaleString("es-PY"));
  cursor.row("Acuerdos Privados firmados por el propietario", stats.acuerdosSigned.toLocaleString("es-PY"));

  cursor.section("Afiliados y valoraciones");
  cursor.row("Afiliados pagados", stats.affiliatesPaid.toLocaleString("es-PY"));
  cursor.row("Valoraciones totales", stats.ratingsTotal.toLocaleString("es-PY"));
  if (stats.ratingsTotal > 0) cursor.subRow(`Promedio: ${stats.ratingsAvg.toFixed(1)} de 5 estrellas`);

  drawFooter(page, pageWidth, font, bold);

  const pdfBytes = await pdfDoc.save();

  return new Response(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agently-reporte-arr-${stats.rangeEnd.getFullYear()}.pdf"`,
    },
  });
}
