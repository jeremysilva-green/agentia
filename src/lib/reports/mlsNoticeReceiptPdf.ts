import { PDFDocument, type PDFFont, rgb } from "pdf-lib";
import { loadReportAssets, drawHeaderBand, drawFooter, createReportCursor } from "@/lib/reports/pdfChrome";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Same wrapping approach as commissionAgreementPdf.ts — not shared from
// there since it's a private helper in that file and this PDF is simple
// enough not to need splitLongWord's unbreakable-token handling too.
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
// Art. 24). Modeled on generateCommissionAgreementPdf's use of the shared
// pdfChrome, just without that file's full-contract layout.
export async function generateMlsNoticeReceiptPdf(details: MlsNoticeReceiptDetails): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const { font, bold, logoImage } = await loadReportAssets(pdfDoc);
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  drawHeaderBand(page, PAGE_WIDTH, PAGE_HEIGHT, font, logoImage, "Comprobante de Aviso — MLS");

  const cursor = createReportCursor(page, PAGE_WIDTH, PAGE_HEIGHT - 150, font, bold);

  // cursor.row()'s value column starts at a fixed x=350, leaving only
  // ~195pt before the page edge — too narrow for a full date string or a
  // UUID reference (both got clipped past the right margin). Stacking
  // label-then-value across the full content width avoids that.
  function field(label: string, value: string) {
    cursor.line(label, 10, false, rgb(0.55, 0.6, 0.65));
    for (const line of wrapText(value, bold, 13, CONTENT_WIDTH)) {
      cursor.line(line, 13, true, rgb(0.05, 0.1, 0.15));
    }
  }

  field("Tipo", details.typeLabel);
  field("Fecha y hora del hecho", details.eventAt.toLocaleString("es-PY", { dateStyle: "long", timeStyle: "short" }));
  field("Referencia", details.referenceId);

  cursor.section(details.title);
  const bodyLines = wrapText(details.body, font, 11, CONTENT_WIDTH);
  for (const line of bodyLines) {
    cursor.line(line, 11, false, rgb(0.2, 0.22, 0.25));
  }

  drawFooter(page, PAGE_WIDTH, font, bold);

  return pdfDoc.save();
}
