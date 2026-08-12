import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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
  const page = pdfDoc.addPage([595, 480]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 420;
  const line = (text: string, size = 12, useBold = false, color = rgb(0.15, 0.15, 0.15)) => {
    page.drawText(text, { x: 50, y, size, font: useBold ? bold : font, color });
    y -= size + 12;
  };

  const dateFmt = (date: Date) =>
    date.toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" });

  line("Agently — Reporte de actividad de tu propiedad", 20, true, rgb(0.02, 0.4, 0.25));
  y -= 8;
  line(`Propiedad: ${details.propertyTitle}`);
  line(`Ciudad: ${details.city}`);
  line(`Para: ${details.sellerName}`);
  line(`Período: ${dateFmt(details.periodStart)} — ${dateFmt(details.periodEnd)}`);
  y -= 8;
  line(`Vistas de la publicación: ${details.viewCount}`, 14, true);
  line(`Interesados que contactaron: ${details.leadCount}`, 14, true, rgb(0.02, 0.4, 0.25));
  y -= 8;
  line("Este reporte se genera automáticamente cada 15 días mientras tu", 10);
  line("propiedad esté publicada, para que sepas cómo está funcionando.", 10);
  line(`Generado el ${dateFmt(details.generatedAt)}.`, 10);

  return pdfDoc.save();
}
