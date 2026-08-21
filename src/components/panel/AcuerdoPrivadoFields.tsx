"use client";

import { useState, type ChangeEvent } from "react";
import { Paperclip, Download } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { getPublicStorageUrl } from "@/lib/storage";
import { PROPERTY_TYPE_VALUES, PROPERTY_TYPE_LABELS } from "@/lib/constants/propertyTypes";
import { CITY_OPTIONS } from "@/lib/constants/cities";
import { getBarriosForCity } from "@/lib/constants/barrios";
import type { PrivateAgreement } from "@/types/domain";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function editableClass(editable: boolean) {
  return editable
    ? "bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
    : "bg-slate-100! text-slate-400! cursor-not-allowed";
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-md bg-prussian px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white">
      {children}
    </div>
  );
}

function Field({
  id,
  label,
  editable,
  value,
  onChange,
  error,
  type = "text",
  inputMode,
  required,
  placeholder,
}: {
  id: string;
  label: string;
  editable: boolean;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  inputMode?: "numeric" | "decimal";
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Input
      id={id}
      name={id}
      label={label}
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={onChange}
      error={error}
      disabled={!editable}
      required={required && editable}
      placeholder={placeholder}
      className={editableClass(editable)}
    />
  );
}

function RadioGroup({
  name,
  label,
  editable,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  editable: boolean;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-1.5 text-sm ${editable ? "text-slate-700" : "text-slate-400"}`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={!editable}
              className="h-3.5 w-3.5 accent-emerald-600 disabled:accent-slate-300"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function CheckField({
  id,
  label,
  editable,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  editable: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex items-center gap-2 text-sm ${editable ? "text-slate-700" : "text-slate-400"}`}>
      <input
        type="checkbox"
        id={id}
        name={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={!editable}
        className="h-3.5 w-3.5 rounded accent-emerald-600 disabled:accent-slate-300"
      />
      {label}
    </label>
  );
}

function SelectField({
  id,
  label,
  editable,
  options,
  defaultValue,
  value,
  onChange,
  required,
  name,
}: {
  id: string;
  label: string;
  editable: boolean;
  options: string[] | { value: string; label: string }[];
  defaultValue?: string | null;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  name?: string;
}) {
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const controlledProps = value !== undefined ? { value } : { defaultValue: defaultValue ?? "" };
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={`text-sm font-medium ${editable ? "text-slate-700" : "text-slate-400"}`}>
        {label}
      </label>
      <select
        id={id}
        name={name ?? id}
        {...controlledProps}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={!editable}
        required={required && editable}
        className={`h-10 rounded-xl border border-slate-200 px-3 text-sm text-prussian outline-none transition-colors focus:border-sage focus:ring-2 focus:ring-sage/20 ${editableClass(editable)}`}
      >
        <option value="">Seleccioná...</option>
        {normalized.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const OTHER_DISTRICT = "__otro__";

// Barrio options depend on the currently selected city (only Asunción has
// curated data). Falls back to plain free text when nothing's known for the
// selected city, or lets the user type their own via "Otro (especificar)".
function DistrictField({
  city,
  editable,
  defaultValue,
}: {
  city: string;
  editable: boolean;
  defaultValue?: string | null;
}) {
  const barrios = getBarriosForCity(city);
  const startsAsOther = Boolean(defaultValue) && !barrios.includes(defaultValue ?? "");
  const [selection, setSelection] = useState(startsAsOther ? OTHER_DISTRICT : defaultValue ?? "");
  const [otherValue, setOtherValue] = useState(startsAsOther ? defaultValue ?? "" : "");

  if (barrios.length === 0) {
    return (
      <Field
        id="property_district"
        label="Distrito / Barrio"
        editable={editable}
        value={otherValue}
        onChange={(e) => setOtherValue(e.target.value)}
      />
    );
  }

  const isOther = selection === OTHER_DISTRICT;

  return (
    <div className="flex flex-col gap-1.5">
      <SelectField
        id="property_district_select"
        name={isOther || selection === "" ? undefined : "property_district"}
        label="Distrito / Barrio"
        editable={editable}
        value={selection}
        onChange={setSelection}
        options={[...barrios.map((b) => ({ value: b, label: b })), { value: OTHER_DISTRICT, label: "Otro (especificar)" }]}
      />
      {isOther && (
        <Input
          id="property_district"
          name="property_district"
          value={otherValue}
          onChange={(e) => setOtherValue(e.target.value)}
          disabled={!editable}
          placeholder="Escribí el barrio"
          className={editableClass(editable)}
        />
      )}
    </div>
  );
}

function DocUploadField({
  id,
  label,
  editable,
  existingPath,
}: {
  id: string;
  label: string;
  editable: boolean;
  existingPath?: string | null;
}) {
  const downloadUrl = existingPath ? getPublicStorageUrl("acuerdo-documentos", existingPath) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={`text-sm font-medium ${editable ? "text-slate-700" : "text-slate-400"}`}>
        {label}
      </label>
      {editable && (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-emerald-100"
        >
          <Paperclip size={13} />
          Adjuntar archivo (imagen o PDF)
          <input id={id} name={id} type="file" accept="image/*,.pdf" className="hidden" />
        </label>
      )}
      {downloadUrl ? (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:underline"
        >
          <Download size={12} />
          {editable ? "Ver archivo adjuntado" : "Descargar"}
        </a>
      ) : (
        !editable && <p className="text-xs text-slate-400">Sin adjuntar</p>
      )}
    </div>
  );
}

export function AcuerdoPrivadoFields({
  viewerRole,
  agreement,
  fieldErrors,
}: {
  viewerRole: "agent" | "owner";
  agreement: Partial<PrivateAgreement>;
  fieldErrors?: Record<string, string>;
}) {
  const agentEditable = viewerRole === "agent";
  const ownerEditable = viewerRole === "owner";
  const today = new Date();
  const [city, setCity] = useState(agreement.property_city ?? "");

  // This is a legal document — a failed save (one bad field) must not
  // silently revert everything else back to its previously-saved value, so
  // every field below is controlled from this one values/checks map instead
  // of using defaultValue/defaultChecked (which React resets after every
  // action call, even when it returns a validation error).
  const toStr = (v: string | number | null | undefined) => (v == null ? "" : String(v));
  const [values, setValues] = useState<Record<string, string>>({
    agent_name: toStr(agreement.agent_name),
    agent_ruc: toStr(agreement.agent_ruc),
    agent_phone: toStr(agreement.agent_phone),
    agent_email: toStr(agreement.agent_email),
    agent_address: toStr(agreement.agent_address),
    owner1_name: toStr(agreement.owner1_name),
    owner1_ci: toStr(agreement.owner1_ci),
    owner2_name: toStr(agreement.owner2_name),
    owner2_ci: toStr(agreement.owner2_ci),
    owner_phone: toStr(agreement.owner_phone),
    owner_email: toStr(agreement.owner_email),
    owner_address: toStr(agreement.owner_address),
    property_type: toStr(agreement.property_type),
    property_address: toStr(agreement.property_address),
    land_area_m2: toStr(agreement.land_area_m2),
    built_area_m2: toStr(agreement.built_area_m2),
    finca_number: toStr(agreement.finca_number),
    padron_number: toStr(agreement.padron_number),
    sale_price: toStr(agreement.sale_price),
    sale_price_words: toStr(agreement.sale_price_words),
    commission: toStr(agreement.commission),
    commission_payment_timing: toStr(agreement.commission_payment_timing),
    commission_payment_other: toStr(agreement.commission_payment_other),
    reservation_condition: toStr(agreement.reservation_condition),
    validity_months: toStr(agreement.validity_months),
    exclusivity: toStr(agreement.exclusivity),
    agent_signed_name: toStr(agreement.agent_signed_name ?? agreement.agent_name),
    owner_signed_name: toStr(agreement.owner_signed_name ?? agreement.owner1_name),
  });
  const [checks, setChecks] = useState({
    commission_vat_included: agreement.commission_vat_included ?? false,
    auto_renewal: agreement.auto_renewal ?? false,
    allow_sign: agreement.allow_sign ?? false,
  });
  const setField = (name: string) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }));
  const setRadio = (name: string) => (value: string) => setValues((prev) => ({ ...prev, [name]: value }));
  const setCheck = (name: keyof typeof checks) => (checked: boolean) =>
    setChecks((prev) => ({ ...prev, [name]: checked }));
  const fieldError = (name: string) => fieldErrors?.[name];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        En la ciudad de <strong className="text-slate-800">{city || "—"}</strong>, a los{" "}
        <strong className="text-slate-800">{today.getDate()}</strong> días del mes de{" "}
        <strong className="text-slate-800">{MONTH_NAMES[today.getMonth()]}</strong> de{" "}
        <strong className="text-slate-800">{today.getFullYear()}</strong>, se celebra el presente acuerdo entre las
        partes indicadas a continuación.
      </div>

      <SectionTitle>1. Datos del agente inmobiliario</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="agent_name" label="Nombre / Razón Social" editable={agentEditable} value={values.agent_name} onChange={setField("agent_name")} error={fieldError("agent_name")} required />
        <Field id="agent_ruc" label="C.I. / RUC" editable={agentEditable} value={values.agent_ruc} onChange={setField("agent_ruc")} error={fieldError("agent_ruc")} required />
        <Field id="agent_phone" label="Teléfono" editable={agentEditable} value={values.agent_phone} onChange={setField("agent_phone")} error={fieldError("agent_phone")} required />
        <Field id="agent_email" label="Correo electrónico" editable={agentEditable} value={values.agent_email} onChange={setField("agent_email")} error={fieldError("agent_email")} type="email" />
        <div className="sm:col-span-2">
          <Field id="agent_address" label="Domicilio" editable={agentEditable} value={values.agent_address} onChange={setField("agent_address")} />
        </div>
      </div>

      <SectionTitle>2. Datos del propietario / vendedor</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="owner1_name" label="Propietario 1 — Nombre completo" editable={ownerEditable} value={values.owner1_name} onChange={setField("owner1_name")} error={fieldError("owner1_name")} required />
        <Field id="owner1_ci" label="C.I./RUC" editable={ownerEditable} value={values.owner1_ci} onChange={setField("owner1_ci")} error={fieldError("owner1_ci")} required />
        <Field id="owner2_name" label="Propietario 2 — Nombre completo (si corresponde)" editable={ownerEditable} value={values.owner2_name} onChange={setField("owner2_name")} />
        <Field id="owner2_ci" label="C.I./RUC" editable={ownerEditable} value={values.owner2_ci} onChange={setField("owner2_ci")} />
        <Field id="owner_phone" label="Teléfono" editable={ownerEditable} value={values.owner_phone} onChange={setField("owner_phone")} error={fieldError("owner_phone")} required />
        <Field id="owner_email" label="Correo electrónico" editable={ownerEditable} value={values.owner_email} onChange={setField("owner_email")} error={fieldError("owner_email")} type="email" />
        <div className="sm:col-span-2">
          <Field id="owner_address" label="Domicilio" editable={ownerEditable} value={values.owner_address} onChange={setField("owner_address")} />
        </div>
      </div>

      <SectionTitle>3. Autorización y datos del inmueble</SectionTitle>
      <p className="text-sm text-slate-600">
        <strong>PRIMERA.</strong> EL/LOS PROPIETARIO(S) autoriza(n) al AGENTE a realizar la intermediación y
        promoción para la venta del inmueble identificado a continuación, bajo las condiciones establecidas en
        este acuerdo.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          id="property_type"
          label="Tipo de inmueble"
          editable={ownerEditable}
          value={values.property_type ?? ""}
          onChange={setRadio("property_type")}
          options={PROPERTY_TYPE_VALUES.map((type) => ({ value: type, label: PROPERTY_TYPE_LABELS[type].es }))}
        />
        <SelectField id="property_city" label="Ciudad" editable={ownerEditable} value={city} onChange={setCity} options={CITY_OPTIONS} required />
        <DistrictField city={city} editable={ownerEditable} defaultValue={agreement.property_district} />
        <Field id="property_address" label="Dirección / Ubicación" editable={ownerEditable} value={values.property_address} onChange={setField("property_address")} />
        <Field id="land_area_m2" label="Superficie de terreno (m²)" editable={ownerEditable} value={values.land_area_m2} onChange={setField("land_area_m2")} type="text" inputMode="decimal" />
        <Field id="built_area_m2" label="Superficie construida (m²)" editable={ownerEditable} value={values.built_area_m2} onChange={setField("built_area_m2")} type="text" inputMode="decimal" />
        <Field id="finca_number" label="Finca / Matrícula N.º" editable={ownerEditable} value={values.finca_number} onChange={setField("finca_number")} />
        <Field id="padron_number" label="Padrón / Cta. Cte. Catastral N.º" editable={ownerEditable} value={values.padron_number} onChange={setField("padron_number")} />
      </div>

      <SectionTitle>4. Precio y comisión</SectionTitle>
      <p className="text-sm text-slate-600">
        <strong>SEGUNDA.</strong> El precio de venta fijado por EL/LOS PROPIETARIO(S) es el indicado a
        continuación.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="sale_price" label="Precio de venta (Gs.)" editable={ownerEditable} value={values.sale_price} onChange={setField("sale_price")} error={fieldError("sale_price")} type="text" inputMode="numeric" required placeholder="sin puntos ni comas" />
        <Field id="sale_price_words" label="Precio en letras" editable={ownerEditable} value={values.sale_price_words} onChange={setField("sale_price_words")} placeholder="Guaraníes..." />
      </div>
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="commission" label="Comisión acordada" editable={agentEditable} value={values.commission} onChange={setField("commission")} placeholder="Ej: 5%" />
          <div className="pt-6">
            <CheckField id="commission_vat_included" label="IVA incluido" editable={agentEditable} checked={checks.commission_vat_included} onChange={setCheck("commission_vat_included")} />
          </div>
        </div>
        <div className="mt-3">
          <RadioGroup
            name="commission_payment_timing"
            label="Forma / momento de pago de la comisión"
            editable={agentEditable}
            value={values.commission_payment_timing}
            onChange={setRadio("commission_payment_timing")}
            options={[
              { value: "reserva", label: "Al recibir la reserva/seña" },
              { value: "cierre", label: "Al cierre de la venta" },
              { value: "otro", label: "Otro" },
            ]}
          />
        </div>
        <div className="mt-3">
          <Field id="commission_payment_other" label='Detalle (si eligió "Otro") / condición de reserva mínima' editable={agentEditable} value={values.commission_payment_other} onChange={setField("commission_payment_other")} />
        </div>
        <div className="mt-3">
          <Field id="reservation_condition" label="% o monto mínimo de reserva/seña" editable={agentEditable} value={values.reservation_condition} onChange={setField("reservation_condition")} />
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Si no se concreta la venta dentro del plazo de vigencia de este acuerdo, EL/LOS PROPIETARIO(S) no
        abonará(n) comisión por una venta no concretada, salvo que las partes acuerden expresamente otra
        condición por escrito.
      </p>

      <SectionTitle>5. Promoción del inmueble</SectionTitle>
      <p className="text-sm text-slate-600">
        <strong>TERCERA.</strong> EL/LOS PROPIETARIO(S) autoriza(n) al AGENTE a promocionar el inmueble mediante
        internet, sitios web, redes sociales, diarios, fotografías, videos, cartelería y otros medios que
        considere adecuados.
      </p>

      <SectionTitle>6. Documentación del inmueble</SectionTitle>
      <p className="text-sm text-slate-600">
        <strong>CUARTA.</strong> LOS PROPIETARIOS manifiestan expresamente ser los Propietarios del INMUEBLE, y
        entregan en este acto al Asesor Inmobiliario, copia de los siguientes documentos:
      </p>
      <p className="text-sm text-slate-600">
        a) Título de Propiedad
        <br />
        b) Comprobante de Impuesto Inmobiliario
        <br />
        c) C.I del Propietario (ambas caras)
      </p>
      <div className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
        <DocUploadField id="doc_title" label="a) Título de Propiedad" editable={ownerEditable} existingPath={agreement.doc_title} />
        <DocUploadField id="doc_tax" label="b) Comprobante de Impuesto Inmobiliario" editable={ownerEditable} existingPath={agreement.doc_tax} />
        <DocUploadField id="doc_id" label="c) C.I. del Propietario (ambas caras)" editable={ownerEditable} existingPath={agreement.doc_id} />
      </div>

      <SectionTitle>7. Vigencia y modalidad</SectionTitle>
      <p className="text-sm text-slate-600">
        <strong>QUINTA.</strong> Este acuerdo tendrá una vigencia expresada en meses desde la fecha de firma.
      </p>
      <div className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
        <Field id="validity_months" label="Vigencia (meses)" editable={agentEditable} value={values.validity_months} onChange={setField("validity_months")} type="text" inputMode="numeric" />
        <RadioGroup
          name="exclusivity"
          label="Modalidad de autorización"
          editable={agentEditable}
          value={values.exclusivity}
          onChange={setRadio("exclusivity")}
          options={[
            { value: "sin_exclusiva", label: "Sin exclusiva" },
            { value: "exclusiva", label: "Exclusiva" },
          ]}
        />
        <div className="sm:col-span-2">
          <CheckField id="auto_renewal" label="Renovación automática salvo comunicación escrita" editable={agentEditable} checked={checks.auto_renewal} onChange={setCheck("auto_renewal")} />
        </div>
      </div>

      <SectionTitle>8. Cartel en el inmueble</SectionTitle>
      <p className="text-sm text-slate-600">
        <strong>SEXTA.</strong> EL/LOS PROPIETARIO(S) autoriza(n) la colocación de un único cartel para la
        comercialización del inmueble:
      </p>
      <CheckField id="allow_sign" label="Autorizo la colocación del cartel" editable={ownerEditable} checked={checks.allow_sign} onChange={setCheck("allow_sign")} />

      <SectionTitle>9. Conformidad</SectionTitle>
      <p className="text-sm text-slate-600">
        Las partes manifiestan haber leído y comprendido las condiciones de este acuerdo y lo suscriben en señal
        de conformidad, en el lugar y fecha indicados.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Firma del agente</p>
          {agreement.agent_signed_at ? (
            <p className="text-sm text-slate-700">
              Firmado por <strong>{agreement.agent_signed_name}</strong> el{" "}
              {new Date(agreement.agent_signed_at).toLocaleDateString("es-PY")}
            </p>
          ) : agentEditable ? (
            <Field id="agent_signed_name" label="Escribí tu nombre completo para firmar" editable required value={values.agent_signed_name} onChange={setField("agent_signed_name")} error={fieldError("agent_signed_name")} />
          ) : (
            <p className="text-sm text-slate-400">Pendiente de firma del agente.</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Firma del propietario</p>
          {agreement.owner_signed_at ? (
            <p className="text-sm text-slate-700">
              Firmado por <strong>{agreement.owner_signed_name}</strong> el{" "}
              {new Date(agreement.owner_signed_at).toLocaleDateString("es-PY")}
            </p>
          ) : ownerEditable ? (
            <Field id="owner_signed_name" label="Escribí tu nombre completo para firmar" editable required value={values.owner_signed_name} onChange={setField("owner_signed_name")} error={fieldError("owner_signed_name")} />
          ) : (
            <p className="text-sm text-slate-400">Pendiente de firma del propietario.</p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Documento modelo para ser completado y firmado por las partes. Las condiciones comerciales deben quedar
        expresamente indicadas antes de la firma.
      </p>
    </div>
  );
}
