// One-off script to export KNOWLEDGE_BASE (src/lib/chatbot/knowledgeBase.ts)
// as a readable PDF for the user. Not part of the app — run manually with
// `npx tsx scripts/generate-knowledge-base-pdf.ts` and delete when no longer
// needed.
import { writeFile } from "fs/promises";
import path from "path";
import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import { KNOWLEDGE_BASE } from "../src/lib/chatbot/knowledgeBase";
import { loadReportAssets, drawHeaderBand, drawFooter, PRUSSIAN, GREEN } from "../src/lib/reports/pdfChrome";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(attempt, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function stripMarkdownEmphasis(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

async function main() {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const { font, bold, logoImage } = await loadReportAssets(pdfDoc);

  drawHeaderBand(page, PAGE_WIDTH, PAGE_HEIGHT, font, logoImage, "Base de conocimiento del chatbot");

  let y = PAGE_HEIGHT - 100 - 40;

  function ensureSpace(neededHeight: number) {
    if (y - neededHeight < 90) {
      drawFooter(page, PAGE_WIDTH, font, bold);
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - 60;
    }
  }

  function paragraph(text: string, size: number, useFont: PDFFont, color: ReturnType<typeof rgb>, lineGap: number) {
    const lines = wrapText(text, useFont, size, CONTENT_WIDTH);
    ensureSpace(lines.length * lineGap + 4);
    for (const line of lines) {
      page.drawText(line, { x: MARGIN, y, size, font: useFont, color });
      y -= lineGap;
    }
  }

  const rawLines = KNOWLEDGE_BASE.split("\n");

  for (const rawLine of rawLines) {
    const line = rawLine.trim();

    if (line === "") {
      y -= 8;
      continue;
    }

    if (line.startsWith("## ")) {
      ensureSpace(30);
      y -= 8;
      paragraph(stripMarkdownEmphasis(line.slice(3)), 15, bold, GREEN, 18);
      y -= 6;
      continue;
    }

    if (line.startsWith("### ")) {
      ensureSpace(24);
      y -= 4;
      paragraph(stripMarkdownEmphasis(line.slice(4)), 12.5, bold, PRUSSIAN, 16);
      y -= 4;
      continue;
    }

    // A line that's ENTIRELY a bold span (FAQ-style questions) — render bold.
    const isFullyBold = /^\*\*.+\*\*$/.test(line);
    const text = stripMarkdownEmphasis(line);

    if (isFullyBold) {
      ensureSpace(16);
      y -= 4;
      paragraph(text, 10.5, bold, rgb(0.05, 0.1, 0.15), 15);
      continue;
    }

    paragraph(text, 10.5, font, rgb(0.2, 0.22, 0.25), 15);
  }

  drawFooter(page, PAGE_WIDTH, font, bold);

  const pdfBytes = await pdfDoc.save();
  const outPath = path.join(process.cwd(), "Base de Conocimiento - Chatbot Agentia.pdf");
  await writeFile(outPath, pdfBytes);
  console.log("Saved to", outPath);
}

main();
