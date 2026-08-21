import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { createClient } from "@/lib/supabase/server";
import { getAgentDashboardStats, getAgentMonthlyTrend, type MonthlyTrendPoint } from "@/lib/data/dashboard";
import { niceMax, formatCompact } from "@/lib/chartMath";

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
const GRID = rgb(0.89, 0.91, 0.94); // slate-200, matches the web chart's gridlines
const AXIS_TEXT = rgb(0.39, 0.45, 0.53); // slate-500

function formatPYG(amount: number) {
  return `Gs. ${amount.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;
}

// Mirrors AnalyticsCharts.tsx's BarTrend, drawn with pdf-lib primitives
// instead of SVG. `x`/`y` is the plot area's bottom-left corner.
function drawBarChart(
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  opts: {
    x: number;
    y: number;
    width: number;
    plotHeight: number;
    title: string;
    subtitle: string;
    data: MonthlyTrendPoint[];
    valueKey: "soldCount" | "interactions";
  }
) {
  const { x, y, width, plotHeight, title, subtitle, data, valueKey } = opts;

  page.drawText(title, { x, y: y + plotHeight + 32, size: 11, font: boldFont, color: PRUSSIAN });
  page.drawText(subtitle, { x, y: y + plotHeight + 18, size: 8, font, color: AXIS_TEXT });

  [0, 0.25, 0.5, 0.75, 1].forEach((step) => {
    const gy = y + plotHeight * step;
    page.drawLine({ start: { x, y: gy }, end: { x: x + width, y: gy }, thickness: 0.5, color: GRID });
  });

  const max = niceMax(Math.max(...data.map((d) => d[valueKey]), 0));
  const bandWidth = width / data.length;
  const barWidth = Math.min(20, bandWidth * 0.5);

  data.forEach((point, i) => {
    const value = point[valueKey];
    const barHeight = max === 0 ? 0 : (value / max) * plotHeight;
    const barX = x + i * bandWidth + (bandWidth - barWidth) / 2;
    page.drawRectangle({ x: barX, y, width: barWidth, height: barHeight, color: GREEN });

    if (value > 0) {
      const label = String(value);
      const labelWidth = font.widthOfTextAtSize(label, 8);
      page.drawText(label, { x: barX + barWidth / 2 - labelWidth / 2, y: y + barHeight + 4, size: 8, font, color: AXIS_TEXT });
    }
    const monthWidth = font.widthOfTextAtSize(point.label, 8);
    page.drawText(point.label, { x: barX + barWidth / 2 - monthWidth / 2, y: y - 14, size: 8, font, color: AXIS_TEXT });
  });
}

// Mirrors AnalyticsCharts.tsx's LineTrend.
function drawLineChart(
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  opts: { x: number; y: number; width: number; plotHeight: number; title: string; subtitle: string; data: MonthlyTrendPoint[] }
) {
  const { x, y, width, plotHeight, title, subtitle, data } = opts;

  page.drawText(title, { x, y: y + plotHeight + 32, size: 11, font: boldFont, color: PRUSSIAN });
  page.drawText(subtitle, { x, y: y + plotHeight + 18, size: 8, font, color: AXIS_TEXT });

  [0, 0.25, 0.5, 0.75, 1].forEach((step) => {
    const gy = y + plotHeight * step;
    page.drawLine({ start: { x, y: gy }, end: { x: x + width, y: gy }, thickness: 0.5, color: GRID });
  });

  const max = niceMax(Math.max(...data.map((d) => d.netIncomePYG), 0));
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: x + i * stepX,
    y: y + (max === 0 ? 0 : (d.netIncomePYG / max) * plotHeight),
    value: d.netIncomePYG,
    label: d.label,
  }));

  for (let i = 1; i < points.length; i++) {
    page.drawLine({ start: points[i - 1], end: points[i], thickness: 2, color: GREEN });
  }

  points.forEach((p) => {
    page.drawEllipse({ x: p.x, y: p.y, xScale: 3, yScale: 3, color: GREEN, borderColor: rgb(1, 1, 1), borderWidth: 1 });

    if (p.value > 0) {
      const label = `Gs. ${formatCompact(p.value)}`;
      const labelWidth = font.widthOfTextAtSize(label, 8);
      page.drawText(label, { x: p.x - labelWidth / 2, y: p.y + 8, size: 8, font, color: AXIS_TEXT });
    }
    const monthWidth = font.widthOfTextAtSize(p.label, 8);
    page.drawText(p.label, { x: p.x - monthWidth / 2, y: y - 14, size: 8, font, color: AXIS_TEXT });
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, full_name, username").eq("id", user.id).single();
  if (profile?.role !== "agent") return new Response("No autorizado", { status: 403 });

  const [stats, monthlyTrend] = await Promise.all([
    getAgentDashboardStats(user.id),
    getAgentMonthlyTrend(user.id),
  ]);
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
  const logoBytes = await readFile(path.join(process.cwd(), "assets", "agentia_00000.png"));
  const logoImage = await pdfDoc.embedPng(logoBytes);

  const headerHeight = 100;
  const drawHeaderBand = (targetPage: PDFPage, targetHeight: number, subtitle: string) => {
    targetPage.drawRectangle({ x: 0, y: targetHeight - headerHeight, width: pageWidth, height: headerHeight, color: PRUSSIAN });
    const logoWidth = 150;
    const logoHeight = logoWidth * (logoImage.height / logoImage.width);
    targetPage.drawImage(logoImage, {
      x: 50,
      y: targetHeight - headerHeight / 2 - logoHeight / 2 + 6,
      width: logoWidth,
      height: logoHeight,
    });
    targetPage.drawText(subtitle, { x: 50, y: targetHeight - headerHeight + 20, size: 11, font, color: rgb(0.8, 0.78, 0.74) });
  };
  const drawFooter = (targetPage: PDFPage) => {
    targetPage.drawLine({
      start: { x: 50, y: 60 },
      end: { x: pageWidth - 50, y: 60 },
      thickness: 0.75,
      color: rgb(0.85, 0.85, 0.85),
    });
    targetPage.drawText(
      `Generado el ${new Date().toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" })}.`,
      { x: 50, y: 42, size: 10, font, color: rgb(0.55, 0.6, 0.65) }
    );
    targetPage.drawText("AGENTIA", {
      x: pageWidth - 50 - bold.widthOfTextAtSize("AGENTIA", 10),
      y: 42,
      size: 10,
      font: bold,
      color: rgb(0.55, 0.6, 0.65),
    });
  };

  drawHeaderBand(page, pageHeight, "Reporte mensual");

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

  drawFooter(page);

  // Page 2: the same trend charts shown on the dashboard, últimos 6 meses.
  const chartsPageHeight = 900;
  const chartsPage = pdfDoc.addPage([pageWidth, chartsPageHeight]);
  drawHeaderBand(chartsPage, chartsPageHeight, "Reporte mensual");

  let cy = chartsPageHeight - headerHeight - 45;
  chartsPage.drawText("Tendencia (últimos 6 meses)", { x: 50, y: cy, size: 14, font: bold, color: GREEN });
  chartsPage.drawLine({ start: { x: 50, y: cy - 6 }, end: { x: pageWidth - 50, y: cy - 6 }, thickness: 0.75, color: rgb(0.85, 0.85, 0.85) });
  cy -= 46;

  const plotHeight = 120;
  const plotWidth = pageWidth - 100;

  drawBarChart(chartsPage, font, bold, {
    x: 50,
    y: cy - plotHeight,
    width: plotWidth,
    plotHeight,
    title: "Interacciones por mes",
    subtitle: "Vistas de tus propiedades, últimos 6 meses",
    data: monthlyTrend,
    valueKey: "interactions",
  });
  cy -= plotHeight + 57 + 26;

  drawBarChart(chartsPage, font, bold, {
    x: 50,
    y: cy - plotHeight,
    width: plotWidth,
    plotHeight,
    title: "Propiedades vendidas por mes",
    subtitle: "Cantidad de ventas cerradas, últimos 6 meses",
    data: monthlyTrend,
    valueKey: "soldCount",
  });
  cy -= plotHeight + 57 + 26;

  drawLineChart(chartsPage, font, bold, {
    x: 50,
    y: cy - plotHeight,
    width: plotWidth,
    plotHeight,
    title: "Balance de ingreso neto",
    subtitle: "Comisión estimada por mes, últimos 6 meses",
    data: monthlyTrend,
  });

  drawFooter(chartsPage);

  const pdfBytes = await pdfDoc.save();

  return new Response(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agently-reporte-${stats.monthStart.getFullYear()}-${String(stats.monthStart.getMonth() + 1).padStart(2, "0")}.pdf"`,
    },
  });
}
