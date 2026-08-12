import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { createClient } from "@/lib/supabase/server";
import { getAgentDashboardStats } from "@/lib/data/dashboard";

const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const PRUSSIAN = rgb(0.071, 0.063, 0.055); // #12100e, same as the site header
const GREEN = rgb(0.02, 0.4, 0.25);

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

  const stats = await getAgentDashboardStats(user.id);
  const agentName = profile.full_name || profile.username || "Agente";
  const monthLabel = `${MONTH_LABELS[stats.monthStart.getMonth()]} ${stats.monthStart.getFullYear()}`;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const pageWidth = 595;
  const pageHeight = 760;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const [regularBytes, semiboldBytes] = await Promise.all([
    readFile(path.join(process.cwd(), "font", "ClashDisplay-Regular.otf")),
    readFile(path.join(process.cwd(), "font", "ClashDisplay-Semibold.otf")),
  ]);
  const font = await pdfDoc.embedFont(regularBytes);
  const bold = await pdfDoc.embedFont(semiboldBytes);

  // Header band with the AGENTIA logo, matching the site's dark header.
  const headerHeight = 100;
  page.drawRectangle({ x: 0, y: pageHeight - headerHeight, width: pageWidth, height: headerHeight, color: PRUSSIAN });

  const logoBytes = await readFile(path.join(process.cwd(), "assets", "agentia_00000.png"));
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoWidth = 150;
  const logoHeight = logoWidth * (logoImage.height / logoImage.width);
  page.drawImage(logoImage, {
    x: 50,
    y: pageHeight - headerHeight / 2 - logoHeight / 2 + 6,
    width: logoWidth,
    height: logoHeight,
  });
  page.drawText("Reporte mensual", {
    x: 50,
    y: pageHeight - headerHeight + 20,
    size: 11,
    font,
    color: rgb(0.8, 0.78, 0.74),
  });

  let y = pageHeight - headerHeight - 45;
  const line = (text: string, size = 12, useBold = false, color = rgb(0.15, 0.15, 0.15)) => {
    page.drawText(text, { x: 50, y, size, font: useBold ? bold : font, color });
    y -= size + 14;
  };
  const section = (title: string) => {
    y -= 6;
    line(title, 14, true, GREEN);
    page.drawLine({
      start: { x: 50, y: y + 20 },
      end: { x: pageWidth - 50, y: y + 20 },
      thickness: 0.75,
      color: rgb(0.85, 0.85, 0.85),
    });
    y -= 6;
  };
  const row = (label: string, value: string) => {
    page.drawText(label, { x: 50, y, size: 12, font, color: rgb(0.35, 0.4, 0.45) });
    page.drawText(value, { x: 350, y, size: 12, font: bold, color: rgb(0.05, 0.1, 0.15) });
    y -= 26;
  };

  line(`${agentName}`, 18, true, PRUSSIAN);
  line(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), 12, false, rgb(0.4, 0.45, 0.5));
  y -= 6;

  section("Actividad del mes");
  row("Vistas de propiedades (clics)", stats.viewsThisMonth.toLocaleString("es-PY"));
  row("Chats iniciados", stats.chatsThisMonth.toLocaleString("es-PY"));
  row("Leads generados", stats.leadsThisMonth.toLocaleString("es-PY"));

  section("Resultados");
  row("Propiedades disponibles (actual)", stats.availableCount.toLocaleString("es-PY"));
  row("Propiedades vendidas (total)", stats.soldCount.toLocaleString("es-PY"));
  row("Propiedades vendidas este mes", stats.soldThisMonthCount.toLocaleString("es-PY"));
  row("Total de ventas del mes", formatPYG(stats.totalSalesThisMonthPYG));
  if (stats.totalSalesThisMonthUSD > 0) {
    row("Total de ventas del mes (USD)", `USD ${stats.totalSalesThisMonthUSD.toLocaleString("es-PY")}`);
  }
  row("Balance de ingreso neto", formatPYG(stats.netIncomePYG));
  if (stats.netIncomeUSD > 0) {
    row("Balance de ingreso neto (USD)", `USD ${stats.netIncomeUSD.toLocaleString("es-PY")}`);
  }

  page.drawLine({
    start: { x: 50, y: 60 },
    end: { x: pageWidth - 50, y: 60 },
    thickness: 0.75,
    color: rgb(0.85, 0.85, 0.85),
  });
  page.drawText(
    `Generado el ${new Date().toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" })}.`,
    { x: 50, y: 42, size: 10, font, color: rgb(0.55, 0.6, 0.65) }
  );
  page.drawText("AGENTIA", {
    x: pageWidth - 50 - bold.widthOfTextAtSize("AGENTIA", 10),
    y: 42,
    size: 10,
    font: bold,
    color: rgb(0.55, 0.6, 0.65),
  });

  const pdfBytes = await pdfDoc.save();

  return new Response(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agently-reporte-${stats.monthStart.getFullYear()}-${String(stats.monthStart.getMonth() + 1).padStart(2, "0")}.pdf"`,
    },
  });
}
