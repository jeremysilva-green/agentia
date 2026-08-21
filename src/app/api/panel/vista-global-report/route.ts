import { PDFDocument } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { getVistaGlobalStats } from "@/lib/data/vistaGlobal";
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

  const stats = await getVistaGlobalStats(user.id);
  const agentName = profile.full_name || profile.username || "Agente";

  const pdfDoc = await PDFDocument.create();
  const { font, bold, logoImage } = await loadReportAssets(pdfDoc);
  const pageWidth = 595;
  const pageHeight = 760;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  drawHeaderBand(page, pageWidth, pageHeight, font, logoImage, "Vista Global");

  const monthLabel = stats.monthLabel.charAt(0).toUpperCase() + stats.monthLabel.slice(1);
  const cursor = createReportCursor(page, pageWidth, pageHeight - HEADER_HEIGHT - 45, font, bold);
  cursor.line(agentName, 18, true);
  cursor.line(monthLabel, 12, false);

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

  cursor.section("Ingresos");
  cursor.row("Ventas cerradas este mes (Gs.)", formatPYG(stats.salesPYG));
  if (stats.salesUSD > 0) cursor.row("Ventas cerradas este mes (USD)", `USD ${stats.salesUSD.toLocaleString("es-PY")}`);

  drawFooter(page, pageWidth, font, bold);

  const pdfBytes = await pdfDoc.save();

  return new Response(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agently-vista-global-${stats.monthStart.getFullYear()}-${String(stats.monthStart.getMonth() + 1).padStart(2, "0")}.pdf"`,
    },
  });
}
