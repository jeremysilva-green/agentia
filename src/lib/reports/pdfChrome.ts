import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// Shared visual chrome for Agently-generated PDFs (header band, footer,
// fonts) — factored out of monthly-report/route.ts so the Vista Global and
// ARR reports look consistent with it without redrawing the same ~80 lines.
export const PRUSSIAN = rgb(0.071, 0.063, 0.055); // #12100e, same as the site header
export const GREEN = rgb(0.02, 0.4, 0.25);
export const HEADER_HEIGHT = 100;

export async function loadReportAssets(pdfDoc: PDFDocument) {
  pdfDoc.registerFontkit(fontkit);
  const [regularBytes, semiboldBytes, logoBytes] = await Promise.all([
    readFile(path.join(process.cwd(), "font", "ClashDisplay-Regular.otf")),
    readFile(path.join(process.cwd(), "font", "ClashDisplay-Semibold.otf")),
    readFile(path.join(process.cwd(), "assets", "agentia_00000.png")),
  ]);
  const font = await pdfDoc.embedFont(regularBytes);
  const bold = await pdfDoc.embedFont(semiboldBytes);
  const logoImage = await pdfDoc.embedPng(logoBytes);
  return { font, bold, logoImage };
}

export function drawHeaderBand(
  page: PDFPage,
  pageWidth: number,
  pageHeight: number,
  font: PDFFont,
  logoImage: PDFImage,
  subtitle: string
) {
  page.drawRectangle({ x: 0, y: pageHeight - HEADER_HEIGHT, width: pageWidth, height: HEADER_HEIGHT, color: PRUSSIAN });
  const logoWidth = 150;
  const logoHeight = logoWidth * (logoImage.height / logoImage.width);
  page.drawImage(logoImage, {
    x: 50,
    y: pageHeight - HEADER_HEIGHT / 2 - logoHeight / 2 + 6,
    width: logoWidth,
    height: logoHeight,
  });
  page.drawText(subtitle, { x: 50, y: pageHeight - HEADER_HEIGHT + 20, size: 11, font, color: rgb(0.8, 0.78, 0.74) });
}

export function drawFooter(page: PDFPage, pageWidth: number, font: PDFFont, bold: PDFFont) {
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
}

// Simple label/value row layout + section headers, used by both the Vista
// Global and ARR reports. Returns a cursor object so callers can keep
// drawing after the last row.
export function createReportCursor(page: PDFPage, pageWidth: number, startY: number, font: PDFFont, bold: PDFFont) {
  let y = startY;
  return {
    get y() {
      return y;
    },
    line(text: string, size = 12, useBold = false, color = rgb(0.15, 0.15, 0.15)) {
      page.drawText(text, { x: 50, y, size, font: useBold ? bold : font, color });
      y -= size + 14;
    },
    section(title: string) {
      y -= 6;
      page.drawText(title, { x: 50, y, size: 14, font: bold, color: GREEN });
      y -= 14 + 14;
      page.drawLine({
        start: { x: 50, y: y + 20 },
        end: { x: pageWidth - 50, y: y + 20 },
        thickness: 0.75,
        color: rgb(0.85, 0.85, 0.85),
      });
      y -= 6;
    },
    row(label: string, value: string) {
      page.drawText(label, { x: 50, y, size: 12, font, color: rgb(0.35, 0.4, 0.45) });
      page.drawText(value, { x: 350, y, size: 12, font: bold, color: rgb(0.05, 0.1, 0.15) });
      y -= 26;
    },
    subRow(text: string) {
      page.drawText(text, { x: 50, y, size: 9, font, color: rgb(0.55, 0.6, 0.65) });
      y -= 20;
    },
  };
}
