import { PDFDocument, type PDFFont, rgb } from "pdf-lib";
import { loadReportAssets, drawHeaderBand, drawFooter, PRUSSIAN, GREEN } from "@/lib/reports/pdfChrome";

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

export type CommissionAgreementDetails = {
  agentName: string;
  agentCiOrRuc: string;
  affiliateName: string;
  affiliateCi: string;
  propertyLabel: string;
  saleValueLabel: string;
  referralLink: string;
  operationDate: string;
  commissionPct: number;
  commissionAmountLabel: string;
  acceptedAt: Date;
};

// Generates the "ACUERDO DE RECONOCIMIENTO Y PAGO DE COMISIÓN POR REFERENCIA"
// contract as a downloadable PDF — text mirrors the approved template
// verbatim, with the blanks substituted. Only EL AGENTE accepts digitally
// (via the mandatory "Acepto" modal before this is generated); EL AFILIADO
// receives a copy in their Avisos tab but doesn't sign anything here.
export async function generateCommissionAgreementPdf(details: CommissionAgreementDetails): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const { font, bold, logoImage } = await loadReportAssets(pdfDoc);

  drawHeaderBand(
    page,
    PAGE_WIDTH,
    PAGE_HEIGHT,
    font,
    logoImage,
    "Acuerdo de reconocimiento y pago de comisión por referencia"
  );

  let y = PAGE_HEIGHT - 100 - 40;

  function ensureSpace(neededHeight: number) {
    if (y - neededHeight < 90) {
      drawFooter(page, PAGE_WIDTH, font, bold);
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - 60;
    }
  }

  function paragraph(text: string, size = 11, useFont = font, color = rgb(0.15, 0.15, 0.15), lineGap = 16) {
    const lines = wrapText(text, useFont, size, CONTENT_WIDTH);
    ensureSpace(lines.length * lineGap + 6);
    for (const line of lines) {
      page.drawText(line, { x: MARGIN, y, size, font: useFont, color });
      y -= lineGap;
    }
    y -= 6;
  }

  function heading(text: string, size = 13) {
    ensureSpace(size + 20);
    y -= 6;
    page.drawText(text, { x: MARGIN, y, size, font: bold, color: GREEN });
    y -= size + 10;
  }

  function title(text: string) {
    const lines = wrapText(text, bold, 16, CONTENT_WIDTH);
    ensureSpace(lines.length * 22 + 10);
    for (const line of lines) {
      page.drawText(line, { x: MARGIN, y, size: 16, font: bold, color: PRUSSIAN });
      y -= 22;
    }
    y -= 8;
  }

  function line(text: string, size = 10, useFont = font, color = rgb(0.25, 0.25, 0.25)) {
    ensureSpace(size + 6);
    page.drawText(text, { x: MARGIN, y, size, font: useFont, color });
    y -= size + 6;
  }

  title("ACUERDO DE RECONOCIMIENTO Y PAGO DE COMISIÓN POR REFERENCIA");

  paragraph(
    `Entre ${details.agentName}, con C.I./RUC N.º ${details.agentCiOrRuc}, en adelante EL AGENTE, y ${details.affiliateName}, con C.I. N.º ${details.affiliateCi}, en adelante EL AFILIADO, se celebra el presente acuerdo respecto de la operación inmobiliaria indicada a continuación.`
  );

  paragraph(`Propiedad: ${details.propertyLabel}`, 11, bold);
  paragraph(`Valor de la operación: ${details.saleValueLabel}`, 11, bold);
  paragraph(`Link de referencia del Afiliado: ${details.referralLink}`, 11, bold);
  paragraph(`Fecha de la operación: ${details.operationDate}`, 11, bold);

  heading("1. Reconocimiento de la referencia");
  paragraph(
    "EL AGENTE reconoce que EL AFILIADO participó en la promoción y/o referencia de la propiedad mediante el enlace único indicado anteriormente y que dicha referencia está vinculada a la presente operación."
  );

  heading("2. Comisión");
  paragraph(
    `Por la operación concretada, EL AGENTE reconoce a favor de EL AFILIADO una comisión equivalente al ${details.commissionPct}% del valor total de la compraventa, correspondiente a ${details.commissionAmountLabel}.`
  );
  paragraph(
    "EL AGENTE se compromete a efectuar el pago de dicha comisión dentro de un plazo razonable contado desde la formalización de la compraventa."
  );

  heading("3. Obligación de pago");
  paragraph(
    "La obligación de pago establecida en este documento corresponde exclusivamente a EL AGENTE. La plataforma AGENTIA actúa únicamente como herramienta tecnológica de registro y vinculación entre las partes y no garantiza, adelanta ni asume el pago de esta comisión."
  );

  heading("4. Incumplimiento");
  paragraph(
    "El incumplimiento injustificado de la obligación de pago facultará a EL AFILIADO a reclamar el monto adeudado por las vías legales correspondientes, incluyendo, cuando corresponda, los daños y perjuicios derivados del incumplimiento."
  );
  paragraph(
    "Asimismo, el incumplimiento podrá dar lugar a la suspensión o cancelación de la cuenta de EL AGENTE dentro de AGENTIA, conforme a sus Términos y Condiciones."
  );

  heading("5. Aceptación");
  paragraph(
    "Las partes declaran que la información consignada es verdadera y que EL AGENTE acepta las obligaciones establecidas en el presente acuerdo."
  );

  ensureSpace(150);
  y -= 10;
  line("EL AGENTE", 12, bold, PRUSSIAN);
  line(`Nombre: ${details.agentName}`);
  line(`C.I./RUC: ${details.agentCiOrRuc}`);
  line(
    `Aceptación digital: aceptado el ${details.acceptedAt.toLocaleDateString("es-PY", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })} a través de Agentia.`
  );

  y -= 20;
  line("EL AFILIADO", 12, bold, PRUSSIAN);
  line(`Nombre: ${details.affiliateName}`);
  line(`C.I.: ${details.affiliateCi}`);
  line("Este documento se genera y comparte automáticamente al confirmarse el cierre del trato.", 9, font, rgb(0.55, 0.6, 0.65));

  drawFooter(page, PAGE_WIDTH, font, bold);

  return pdfDoc.save();
}
