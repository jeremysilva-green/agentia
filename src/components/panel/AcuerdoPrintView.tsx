import { PROPERTY_TYPE_LABELS, isPropertyType } from "@/lib/constants/propertyTypes";
import type { PrivateAgreement } from "@/types/domain";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const COMMISSION_TIMING_LABEL: Record<string, string> = {
  reserva: "Al recibir la reserva/seña",
  cierre: "Al cierre de la venta",
  otro: "Otro",
};

const EXCLUSIVITY_LABEL: Record<string, string> = {
  sin_exclusiva: "Sin exclusiva",
  exclusiva: "Exclusiva",
};

function fmt(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function fmtMoney(value: number | null) {
  if (value == null) return "—";
  return `Gs. ${value.toLocaleString("es-PY")}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <div className="mt-4 bg-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white print:bg-black print:text-white">
        {title}
      </div>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 border-b border-slate-100 py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function AcuerdoPrintView({ agreement }: { agreement: PrivateAgreement }) {
  const today = new Date();
  const typeLabel =
    agreement.property_type && isPropertyType(agreement.property_type)
      ? PROPERTY_TYPE_LABELS[agreement.property_type].es
      : fmt(agreement.property_type);

  return (
    <div
      className="mx-auto max-w-3xl bg-white p-8 text-slate-900 print:p-0"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}
    >
      <h1 className="text-center text-lg font-bold uppercase tracking-wide">
        Autorización para Intermediar Venta de Inmueble
      </h1>
      <p className="mt-1 text-center text-xs text-slate-500">
        Acuerdo privado de corretaje inmobiliario — Sin exclusiva
      </p>

      <p className="mt-4 rounded border border-slate-200 p-3 text-sm text-slate-600">
        En la ciudad de <strong>{fmt(agreement.property_city)}</strong>, a los <strong>{today.getDate()}</strong>{" "}
        días del mes de <strong>{MONTH_NAMES[today.getMonth()]}</strong> de <strong>{today.getFullYear()}</strong>,
        se celebra el presente acuerdo entre las partes indicadas a continuación.
      </p>

      <Section title="1. Datos del agente inmobiliario">
        <Row label="Nombre / Razón Social" value={fmt(agreement.agent_name)} />
        <Row label="C.I. / RUC" value={fmt(agreement.agent_ruc)} />
        <Row label="Teléfono" value={fmt(agreement.agent_phone)} />
        <Row label="Correo electrónico" value={fmt(agreement.agent_email)} />
        <Row label="Domicilio" value={fmt(agreement.agent_address)} />
      </Section>

      <Section title="2. Datos del propietario / vendedor">
        <Row label="Propietario 1" value={fmt(agreement.owner1_name)} />
        <Row label="C.I./RUC" value={fmt(agreement.owner1_ci)} />
        {agreement.owner2_name && <Row label="Propietario 2" value={fmt(agreement.owner2_name)} />}
        {agreement.owner2_name && <Row label="C.I./RUC" value={fmt(agreement.owner2_ci)} />}
        <Row label="Teléfono" value={fmt(agreement.owner_phone)} />
        <Row label="Correo electrónico" value={fmt(agreement.owner_email)} />
        <Row label="Domicilio" value={fmt(agreement.owner_address)} />
      </Section>

      <Section title="3. Autorización y datos del inmueble">
        <Row label="Tipo de inmueble" value={typeLabel} />
        <Row label="Ciudad" value={fmt(agreement.property_city)} />
        <Row label="Distrito / Barrio" value={fmt(agreement.property_district)} />
        <Row label="Dirección / Ubicación" value={fmt(agreement.property_address)} />
        <Row label="Superficie de terreno" value={agreement.land_area_m2 != null ? `${agreement.land_area_m2} m²` : "—"} />
        <Row label="Superficie construida" value={agreement.built_area_m2 != null ? `${agreement.built_area_m2} m²` : "—"} />
        <Row label="Finca / Matrícula N.º" value={fmt(agreement.finca_number)} />
        <Row label="Padrón / Cta. Cte. Catastral N.º" value={fmt(agreement.padron_number)} />
      </Section>

      <Section title="4. Precio y comisión">
        <Row label="Precio de venta" value={fmtMoney(agreement.sale_price)} />
        <Row label="Precio en letras" value={fmt(agreement.sale_price_words)} />
        <Row label="Comisión acordada" value={fmt(agreement.commission)} />
        <Row label="IVA incluido" value={agreement.commission_vat_included ? "Sí" : "No"} />
        <Row
          label="Forma / momento de pago"
          value={agreement.commission_payment_timing ? COMMISSION_TIMING_LABEL[agreement.commission_payment_timing] : "—"}
        />
        <Row label="Detalle / condición de reserva" value={fmt(agreement.commission_payment_other)} />
        <Row label="% o monto mínimo de reserva" value={fmt(agreement.reservation_condition)} />
      </Section>

      <Section title="6. Documentación del inmueble">
        <Row label="a) Título de Propiedad" value={agreement.doc_title ? "Adjuntado" : "Sin adjuntar"} />
        <Row label="b) Comprobante de Impuesto Inmobiliario" value={agreement.doc_tax ? "Adjuntado" : "Sin adjuntar"} />
        <Row label="c) C.I. del Propietario (ambas caras)" value={agreement.doc_id ? "Adjuntado" : "Sin adjuntar"} />
      </Section>

      <Section title="7. Vigencia y modalidad">
        <Row label="Vigencia" value={agreement.validity_months != null ? `${agreement.validity_months} meses` : "—"} />
        <Row label="Modalidad" value={agreement.exclusivity ? EXCLUSIVITY_LABEL[agreement.exclusivity] : "—"} />
        <Row label="Renovación automática" value={agreement.auto_renewal ? "Sí" : "No"} />
      </Section>

      <Section title="8. Cartel en el inmueble">
        <Row label="Autoriza colocación de cartel" value={agreement.allow_sign ? "Sí" : "No"} />
      </Section>

      <Section title="9. Conformidad">
        <div className="mt-4 grid grid-cols-2 gap-8 text-center text-sm">
          <div className="border-t border-slate-800 pt-2">
            <p className="font-semibold">AGENTE INMOBILIARIO</p>
            <p className="mt-1">{fmt(agreement.agent_signed_name || agreement.agent_name)}</p>
            <p className="text-xs text-slate-500">
              {agreement.agent_signed_at
                ? `Firmado el ${new Date(agreement.agent_signed_at).toLocaleDateString("es-PY")}`
                : "Pendiente de firma"}
            </p>
          </div>
          <div className="border-t border-slate-800 pt-2">
            <p className="font-semibold">PROPIETARIO / VENDEDOR</p>
            <p className="mt-1">{fmt(agreement.owner_signed_name || agreement.owner1_name)}</p>
            <p className="text-xs text-slate-500">
              {agreement.owner_signed_at
                ? `Firmado el ${new Date(agreement.owner_signed_at).toLocaleDateString("es-PY")}`
                : "Pendiente de firma"}
            </p>
          </div>
        </div>
      </Section>

      <p className="mt-6 text-center text-[10px] text-slate-400">
        Documento generado por AGENTIA. No reemplaza asesoramiento legal o notarial.
      </p>
    </div>
  );
}
