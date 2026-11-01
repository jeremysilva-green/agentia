import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// Dark, portrait report that the agent sends to the seller by WhatsApp, so the
// page is phone-shaped and everything sits in a few compact blocks.
const PAGE_WIDTH = 480;
const PAGE_HEIGHT = 560;
const MARGIN = 32;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const BG = rgb(0.055, 0.055, 0.055); // #0e0e0e
const CARD = rgb(0.086, 0.11, 0.098); // #161c19
const LINE = rgb(0.13, 0.4, 0.29);
const GREEN = rgb(0.075, 0.769, 0.498); // #13c47f
const WHITE = rgb(1, 1, 1);
const MUTED = rgb(0.6, 0.65, 0.62);

function fit(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && font.widthOfTextAtSize(`${cut}…`, size) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

function card(page: PDFPage, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, color: CARD, borderColor: LINE, borderWidth: 0.8, borderOpacity: 0.7 });
}

export async function generateVendorReportPdf(details: {
  sellerName: string;
  propertyTitle: string;
  city: string;
  periodStart: Date;
  periodEnd: Date;
  viewCount: number;
  leadCount: number;
  generatedAt: Date;
}) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const [lightBytes, semiboldBytes, logoBytes] = await Promise.all([
    readFile(path.join(process.cwd(), "font", "ClashDisplay-Light.otf")),
    readFile(path.join(process.cwd(), "font", "ClashDisplay-Semibold.otf")),
    readFile(path.join(process.cwd(), "assets", "agentia-04.png")),
  ]);
  const light = await pdfDoc.embedFont(lightBytes);
  const bold = await pdfDoc.embedFont(semiboldBytes);
  const logo = await pdfDoc.embedPng(logoBytes);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: BG });
  // Thin green accent along the top edge.
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 4, width: PAGE_WIDTH, height: 4, color: GREEN });

  const dateFmt = (date: Date) => date.toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" });
  const shortFmt = (date: Date) => date.toLocaleDateString("es-PY", { day: "numeric", month: "long" });

  // Logo
  const logoHeight = 26;
  const logoWidth = logoHeight * (logo.width / logo.height);
  let y = PAGE_HEIGHT - MARGIN - logoHeight;
  page.drawImage(logo, { x: MARGIN, y, width: logoWidth, height: logoHeight });

  // Title
  y -= 46;
  page.drawText("REPORTE DE ACTIVIDAD", { x: MARGIN, y, size: 9.5, font: bold, color: GREEN });
  y -= 30;
  page.drawText("Cómo va tu propiedad", { x: MARGIN, y, size: 28, font: bold, color: WHITE });
  y -= 18;
  page.drawText(`${shortFmt(details.periodStart)} — ${dateFmt(details.periodEnd)}`, {
    x: MARGIN,
    y,
    size: 11,
    font: light,
    color: MUTED,
  });

  // Property card
  y -= 24;
  const propertyCardHeight = 86;
  card(page, MARGIN, y - propertyCardHeight, CONTENT_WIDTH, propertyCardHeight);
  const pad = 16;
  page.drawText("PROPIEDAD", { x: MARGIN + pad, y: y - 24, size: 8.5, font: bold, color: GREEN });
  page.drawText(fit(details.propertyTitle, bold, 17, CONTENT_WIDTH - pad * 2), {
    x: MARGIN + pad,
    y: y - 46,
    size: 17,
    font: bold,
    color: WHITE,
  });
  page.drawText(fit(`${details.city}  ·  Para ${details.sellerName}`, light, 11, CONTENT_WIDTH - pad * 2), {
    x: MARGIN + pad,
    y: y - 68,
    size: 11,
    font: light,
    color: MUTED,
  });
  y -= propertyCardHeight + 14;

  // Two stat cards
  const gap = 12;
  const statWidth = (CONTENT_WIDTH - gap) / 2;
  const statHeight = 132;
  const stats = [
    { label: "VISTAS", value: details.viewCount, hint: "personas vieron tu publicación" },
    { label: "INTERESADOS", value: details.leadCount, hint: "contactaron al agente" },
  ];
  stats.forEach((stat, i) => {
    const x = MARGIN + i * (statWidth + gap);
    card(page, x, y - statHeight, statWidth, statHeight);
    page.drawRectangle({ x, y: y - 3, width: statWidth, height: 3, color: GREEN, opacity: i === 0 ? 0.5 : 1 });
    page.drawText(stat.label, { x: x + pad, y: y - 28, size: 8.5, font: bold, color: GREEN });
    page.drawText(String(stat.value), { x: x + pad, y: y - 82, size: 50, font: bold, color: WHITE });
    page.drawText(fit(stat.hint, light, 9.5, statWidth - pad * 2), {
      x: x + pad,
      y: y - 108,
      size: 9.5,
      font: light,
      color: MUTED,
    });
  });
  y -= statHeight + 14;

  // Note
  const noteHeight = 62;
  card(page, MARGIN, y - noteHeight, CONTENT_WIDTH, noteHeight);
  page.drawRectangle({ x: MARGIN, y: y - noteHeight, width: 3, height: noteHeight, color: GREEN });
  const noteLines = ["Este reporte se genera automáticamente cada 15 días", "mientras tu propiedad esté publicada, para que sepas", "cómo está funcionando."];
  noteLines.forEach((text, i) => {
    page.drawText(text, { x: MARGIN + pad, y: y - 22 - i * 14, size: 10, font: light, color: rgb(0.82, 0.86, 0.84) });
  });

  // Footer
  page.drawLine({
    start: { x: MARGIN, y: MARGIN + 18 },
    end: { x: PAGE_WIDTH - MARGIN, y: MARGIN + 18 },
    thickness: 0.6,
    color: LINE,
    opacity: 0.6,
  });
  page.drawText(`Generado el ${dateFmt(details.generatedAt)}`, { x: MARGIN, y: MARGIN, size: 9, font: light, color: MUTED });
  const site = "agentia.com.py";
  page.drawText(site, {
    x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(site, 9),
    y: MARGIN,
    size: 9,
    font: bold,
    color: GREEN,
  });

  return pdfDoc.save();
}
