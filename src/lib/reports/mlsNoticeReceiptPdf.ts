import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const PAGE_WIDTH = 480;
const MARGIN = 32;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PAD = 16;

const BG = rgb(0.055, 0.055, 0.055); // #0e0e0e
const CARD = rgb(0.086, 0.11, 0.098); // #161c19
const LINE = rgb(0.13, 0.4, 0.29);
const GREEN = rgb(0.075, 0.769, 0.498); // #13c47f
const WHITE = rgb(1, 1, 1);
const MUTED = rgb(0.6, 0.65, 0.62);
const SOFT = rgb(0.82, 0.86, 0.84);

// Same wrapping approach as commissionAgreementPdf.ts — not shared from
// there since it's a private helper in that file.
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(attempt, size) <= maxWidth) {
      current = attempt;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export type MlsNoticeReceiptDetails = {
  title: string;
  body: string;
  typeLabel: string;
  eventAt: Date;
  referenceId: string;
};

// "Descargar comprobante" PDF — a simple proof-of-record for one Aviso, for
// an agent to use as evidence outside the platform (per the MLS Reglamento,
// Art. 24). Same dark, phone-shaped look as the seller activity report; the
// page height follows the text so short notices don't leave an empty page.
export async function generateMlsNoticeReceiptPdf(details: MlsNoticeReceiptDetails): Promise<Uint8Array> {
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

  const titleLines = wrapText(details.title, bold, 21, CONTENT_WIDTH);
  const bodyLines = wrapText(details.body, light, 11, CONTENT_WIDTH - PAD * 2 - 4);
  const dateText = details.eventAt.toLocaleString("es-PY", { dateStyle: "long", timeStyle: "short" });

  const logoHeight = 26;
  const fieldsHeight = 3 * 38 + 12;
  const bodyHeight = PAD * 2 + bodyLines.length * 16 - 4;
  const pageHeight =
    MARGIN + logoHeight + 40 + 14 + titleLines.length * 27 + 18 + fieldsHeight + 14 + bodyHeight + 26 + 36 + MARGIN - 12;

  const page = pdfDoc.addPage([PAGE_WIDTH, pageHeight]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: pageHeight, color: BG });
  page.drawRectangle({ x: 0, y: pageHeight - 4, width: PAGE_WIDTH, height: 4, color: GREEN });

  const dateFmt = (date: Date) => date.toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" });

  let y = pageHeight - MARGIN - logoHeight;
  page.drawImage(logo, { x: MARGIN, y, width: logoHeight * (logo.width / logo.height), height: logoHeight });

  y -= 40;
  page.drawText("COMPROBANTE DE AVISO · MLS", { x: MARGIN, y, size: 9.5, font: bold, color: GREEN });
  y -= 14;
  for (const line of titleLines) {
    y -= 27;
    page.drawText(line, { x: MARGIN, y: y + 6, size: 21, font: bold, color: WHITE });
  }

  // Fields card
  y -= 18;
  page.drawRectangle({
    x: MARGIN,
    y: y - fieldsHeight,
    width: CONTENT_WIDTH,
    height: fieldsHeight,
    color: CARD,
    borderColor: LINE,
    borderWidth: 0.8,
    borderOpacity: 0.7,
  });
  const fields: [string, string][] = [
    ["TIPO", details.typeLabel],
    ["FECHA Y HORA DEL HECHO", dateText],
    ["REFERENCIA", details.referenceId],
  ];
  fields.forEach(([label, value], i) => {
    const top = y - 12 - i * 38;
    page.drawText(label, { x: MARGIN + PAD, y: top - 12, size: 8, font: bold, color: GREEN });
    page.drawText(value, { x: MARGIN + PAD, y: top - 28, size: 12, font: bold, color: WHITE });
  });
  y -= fieldsHeight + 14;

  // Body card
  page.drawRectangle({
    x: MARGIN,
    y: y - bodyHeight,
    width: CONTENT_WIDTH,
    height: bodyHeight,
    color: CARD,
    borderColor: LINE,
    borderWidth: 0.8,
    borderOpacity: 0.7,
  });
  page.drawRectangle({ x: MARGIN, y: y - bodyHeight, width: 3, height: bodyHeight, color: GREEN });
  bodyLines.forEach((line, i) => {
    page.drawText(line, { x: MARGIN + PAD + 4, y: y - PAD - 9 - i * 16, size: 11, font: light, color: SOFT });
  });

  // Footer
  page.drawLine({
    start: { x: MARGIN, y: MARGIN + 18 },
    end: { x: PAGE_WIDTH - MARGIN, y: MARGIN + 18 },
    thickness: 0.6,
    color: LINE,
    opacity: 0.6,
  });
  page.drawText(`Generado el ${dateFmt(new Date())}`, { x: MARGIN, y: MARGIN, size: 9, font: light, color: MUTED });
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
