"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SingleSelectDropdown } from "@/components/ui/SingleSelectDropdown";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";
import { Button } from "@/components/ui/Button";
import { PROPERTY_TYPE_VALUES, PROPERTY_TYPE_LABELS } from "@/lib/constants/propertyTypes";
import { CITY_OPTIONS } from "@/lib/constants/cities";
import { AGENT_COMMISSION_PCT, AFFILIATE_COMMISSION_PCT } from "@/lib/constants/commission";
import { NEGOTIATION_OPTIONS } from "@/lib/constants/negotiation";
import { submitClientRequest } from "@/lib/actions/clientRequests";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/cn";
import type { ClientRequestKind } from "@/lib/constants/clientRequests";

const PROPERTY_TYPE_OPTIONS = PROPERTY_TYPE_VALUES.map((type) => ({
  value: type,
  label: PROPERTY_TYPE_LABELS[type].es,
}));
const CITY_SELECT_OPTIONS = CITY_OPTIONS.map((city) => ({ value: city, label: city }));
const CURRENCIES = ["PYG", "USD"] as const;

const checkboxClass = "h-3.5 w-3.5 rounded border-bone text-emerald-600 accent-emerald-600 focus-visible:outline-emerald-600";
const fieldClass = "bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!";

export function ClientRequestModal({
  kind,
  agentId,
  onClose,
}: {
  kind: ClientRequestKind;
  agentId: string;
  onClose: () => void;
}) {
  const action = submitClientRequest.bind(null, agentId, kind);
  const [state, formAction, pending] = useActionState(action, undefined);
  // React resets uncontrolled <form> fields after every action call — even
  // when the action returns a validation error rather than throwing — so
  // every field here is controlled to survive a failed submit. See
  // fieldValue/setField below.
  const [values, setValues] = useState<Record<string, string>>({});
  const setField = (name: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }));
  const fieldValue = (name: string) => values[name] ?? "";
  const fieldError = (name: string) => state?.fieldErrors?.[name];
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("PYG");
  const [withIva, setWithIva] = useState(false);
  const [propertyType, setPropertyType] = useState("");
  const [enConstruccion, setEnConstruccion] = useState(false);
  const [preventa, setPreventa] = useState(false);
  const [negotiationType, setNegotiationType] = useState<string[]>([]);

  const priceNum = Number(price) || 0;
  const agentCommission = priceNum * (AGENT_COMMISSION_PCT / 100);
  const affiliateCommission = priceNum * (AFFILIATE_COMMISSION_PCT / 100);

  function handleToggleIva(checked: boolean) {
    setWithIva(checked);
    const current = Number(price) || 0;
    if (current > 0) {
      setPrice(String(Math.round(checked ? current * 1.1 : current / 1.1)));
    }
  }
  const formatMoney = (amount: number) => `${currency} ${amount.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;

  const isVendedor = kind === "vendedor";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="my-8 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:my-0 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              {isVendedor ? copy.clientRequest.vendedorTitle : copy.clientRequest.compradorTitle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isVendedor ? copy.clientRequest.vendedorSubtitle : copy.clientRequest.compradorSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-slate-400 transition-colors hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {state?.success ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-sage-dark">{copy.clientRequest.successTitle}</span>{" "}
              {isVendedor ? copy.clientRequest.successVendedor : copy.clientRequest.successComprador}
            </p>
            <Button type="button" size="sm" variant="secondary" onClick={onClose}>
              {copy.clientRequest.close}
            </Button>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-3">
            <Input
              id="fullName"
              name="fullName"
              label={copy.clientRequest.fullName}
              required
              value={fieldValue("fullName")}
              onChange={setField("fullName")}
              error={fieldError("fullName")}
              className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
            />
            <Input
              id="phone"
              name="phone"
              label={copy.clientRequest.phone}
              required
              placeholder="+595 9xx xxx xxx"
              value={fieldValue("phone")}
              onChange={setField("phone")}
              error={fieldError("phone")}
              className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
            />
            <SingleSelectDropdown
              name="propertyType"
              label={copy.clientRequest.propertyType}
              showAllOption={false}
              options={PROPERTY_TYPE_OPTIONS}
              onChange={setPropertyType}
              error={fieldError("propertyType")}
              buttonClassName="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
              panelClassName="border-emerald-100! bg-emerald-50!"
            />

            {propertyType === "proyecto_en_pozo" && (
              <div className="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="enConstruccion"
                    checked={enConstruccion}
                    onChange={(e) => setEnConstruccion(e.target.checked)}
                    className={checkboxClass}
                  />
                  En Construcción
                </label>
                {enConstruccion && (
                  <Input
                    id="fechaFinalizacion"
                    name="fechaFinalizacion"
                    label="Fecha de finalización del proyecto"
                    placeholder="dd/mm/aa"
                    value={fieldValue("fechaFinalizacion")}
                    onChange={setField("fechaFinalizacion")}
                    className={fieldClass}
                  />
                )}

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="preventa"
                    checked={preventa}
                    onChange={(e) => setPreventa(e.target.checked)}
                    className={checkboxClass}
                  />
                  Preventa
                </label>
                {preventa && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">¿Qué tipo de financiación existe para este proyecto?</span>
                    <Input
                      id="financiacionDetalle"
                      name="financiacionDetalle"
                      value={fieldValue("financiacionDetalle")}
                      onChange={setField("financiacionDetalle")}
                      className={fieldClass}
                    />
                  </div>
                )}
              </div>
            )}
            <SingleSelectDropdown
              name="city"
              label={copy.clientRequest.city}
              showAllOption={false}
              options={CITY_SELECT_OPTIONS}
              error={fieldError("city")}
              buttonClassName="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
              panelClassName="border-emerald-100! bg-emerald-50!"
            />
            <Textarea
              id="description"
              name="description"
              label={copy.clientRequest.description}
              required
              value={fieldValue("description")}
              onChange={setField("description")}
              error={fieldError("description")}
              className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
            />

            {isVendedor ? (
              <div className="flex flex-col gap-1.5">
                <MultiSelectDropdown
                  name="negotiationOptions"
                  label="Opciones de negociación"
                  allLabel="Todas"
                  options={NEGOTIATION_OPTIONS}
                  onChange={setNegotiationType}
                  buttonClassName={fieldClass}
                  panelClassName="border-emerald-100! bg-emerald-50!"
                />
                {negotiationType.includes("canje_permuta") && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">¿Qué aceptás en la permuta? (ej: terreno, auto, o combinación con efectivo)</span>
                    <Textarea
                      id="negotiationDetails"
                      name="negotiationDetails"
                      value={fieldValue("negotiationDetails")}
                      onChange={setField("negotiationDetails")}
                      className={fieldClass}
                    />
                  </div>
                )}

                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  <Input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    min="0"
                    step="1"
                    label="Habitaciones"
                    value={fieldValue("bedrooms")}
                    onChange={setField("bedrooms")}
                    error={fieldError("bedrooms")}
                    className={fieldClass}
                  />
                  <Input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    min="0"
                    step="1"
                    label="Baños"
                    value={fieldValue("bathrooms")}
                    onChange={setField("bathrooms")}
                    error={fieldError("bathrooms")}
                    className={fieldClass}
                  />
                  <Input
                    id="areaM2"
                    name="areaM2"
                    type="number"
                    min="0"
                    step="0.01"
                    label="M²"
                    value={fieldValue("areaM2")}
                    onChange={setField("areaM2")}
                    error={fieldError("areaM2")}
                    className={fieldClass}
                  />
                </div>
                <SingleSelectDropdown
                  name="garage"
                  label="Garage"
                  showAllOption={false}
                  defaultValue="false"
                  options={[
                    { value: "false", label: "No" },
                    { value: "true", label: "Sí" },
                  ]}
                  buttonClassName={fieldClass}
                  panelClassName="border-emerald-100! bg-emerald-50!"
                />
                <div className="flex flex-col gap-1">
                  <Input
                    id="mapsUrl"
                    name="mapsUrl"
                    label="Enlace de Google Maps"
                    placeholder="https://maps.app.goo.gl/..."
                    value={fieldValue("mapsUrl")}
                    onChange={setField("mapsUrl")}
                    error={fieldError("mapsUrl")}
                    className={fieldClass}
                  />
                  <p className="text-xs text-slate-500">Pegá el enlace para compartir de Google Maps, si lo tenés a mano.</p>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-700">{copy.clientRequest.price}</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        name="priceIncludesIva"
                        checked={withIva}
                        onChange={(e) => handleToggleIva(e.target.checked)}
                        className={checkboxClass}
                      />
                      +IVA
                    </label>
                    <div className="flex h-6 shrink-0 items-center rounded-lg border border-slate-200 p-0.5 text-[11px] font-medium">
                      {CURRENCIES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setCurrency(option)}
                          className={cn(
                            "rounded px-2 py-0.5 transition-colors",
                            currency === option ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <input type="hidden" name="currency" value={currency} />
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  error={fieldError("price")}
                  placeholder="sin puntos ni comas"
                  className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
                />
                <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Comisión Agente ({AGENT_COMMISSION_PCT}%)</span>
                    <span className="font-medium text-slate-700">{formatMoney(agentCommission)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Comisión Referido ({AFFILIATE_COMMISSION_PCT}%)</span>
                    <span className="font-medium text-slate-700">{formatMoney(affiliateCommission)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="priceMin"
                    name="priceMin"
                    type="number"
                    min="0"
                    step="1"
                    label={`${copy.clientRequest.priceMin} (Gs.)`}
                    required
                    value={fieldValue("priceMin")}
                    onChange={setField("priceMin")}
                    error={fieldError("priceMin")}
                    placeholder="sin puntos ni comas"
                    className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
                  />
                  <Input
                    id="priceMax"
                    name="priceMax"
                    type="number"
                    min="0"
                    step="1"
                    label={`${copy.clientRequest.priceMax} (Gs.)`}
                    required
                    value={fieldValue("priceMax")}
                    onChange={setField("priceMax")}
                    error={fieldError("priceMax")}
                    placeholder="sin puntos ni comas"
                    className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {copy.clientRequest.commissionDisclaimer(AGENT_COMMISSION_PCT + AFFILIATE_COMMISSION_PCT)}
                </p>
              </div>
            )}

            {state?.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}

            <Button type="submit" size="md" disabled={pending} className="mt-1 font-display">
              {pending ? copy.clientRequest.submitting : copy.clientRequest.submit}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
