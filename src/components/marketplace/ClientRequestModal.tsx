"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SingleSelectDropdown } from "@/components/ui/SingleSelectDropdown";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";
import { Button } from "@/components/ui/Button";
import { PROPERTY_TYPE_VALUES, PROPERTY_TYPE_LABELS } from "@/lib/constants/propertyTypes";
import { CITY_OPTIONS } from "@/lib/constants/cities";
import { AGENT_COMMISSION_PCT, AFFILIATE_COMMISSION_PCT } from "@/lib/constants/commission";
import { submitClientRequest } from "@/lib/actions/clientRequests";
import { copy } from "@/lib/copy";
import type { ClientRequestKind } from "@/lib/constants/clientRequests";

const PROPERTY_TYPE_OPTIONS = PROPERTY_TYPE_VALUES.map((type) => ({
  value: type,
  label: PROPERTY_TYPE_LABELS[type].es,
}));
const CITY_SELECT_OPTIONS = CITY_OPTIONS.map((city) => ({ value: city, label: city }));

const NEGOTIATION_OPTIONS = [
  { value: "precio_fijo", label: "Precio fijo, no negociable." },
  { value: "canje_permuta", label: "Hacer canje/permuta." },
  { value: "negociar_precio", label: "Negociar el precio." },
];

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
  const [price, setPrice] = useState("");
  const [withIva, setWithIva] = useState(false);
  const [propertyType, setPropertyType] = useState("");
  const [enConstruccion, setEnConstruccion] = useState(false);
  const [preventa, setPreventa] = useState(false);

  const priceNum = Number(price) || 0;
  const agentCommission = priceNum * (AGENT_COMMISSION_PCT / 100);
  const affiliateCommission = priceNum * (AFFILIATE_COMMISSION_PCT / 100);
  const formatMoney = (amount: number) => `Gs. ${amount.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;

  const isVendedor = kind === "vendedor";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
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
              className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
            />
            <Input
              id="phone"
              name="phone"
              label={copy.clientRequest.phone}
              required
              placeholder="+595 9xx xxx xxx"
              className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
            />
            <SingleSelectDropdown
              name="propertyType"
              label={copy.clientRequest.propertyType}
              showAllOption={false}
              options={PROPERTY_TYPE_OPTIONS}
              onChange={setPropertyType}
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
                    <Input id="financiacionDetalle" name="financiacionDetalle" className={fieldClass} />
                  </div>
                )}
              </div>
            )}
            <SingleSelectDropdown
              name="city"
              label={copy.clientRequest.city}
              showAllOption={false}
              options={CITY_SELECT_OPTIONS}
              buttonClassName="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
              panelClassName="border-emerald-100! bg-emerald-50!"
            />
            <Textarea
              id="description"
              name="description"
              label={copy.clientRequest.description}
              required
              className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
            />

            {isVendedor ? (
              <div className="flex flex-col gap-1.5">
                <MultiSelectDropdown
                  name="negotiationOptions"
                  label="Opciones de negociación"
                  allLabel="Todas"
                  options={NEGOTIATION_OPTIONS}
                  buttonClassName={fieldClass}
                  panelClassName="border-emerald-100! bg-emerald-50!"
                />

                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-700">{copy.clientRequest.price} (Gs.)</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={withIva}
                      onChange={(e) => setWithIva(e.target.checked)}
                      className={checkboxClass}
                    />
                    +IVA
                    <span className="font-medium text-slate-700">
                      {withIva ? formatMoney(priceNum * 1.1) : "Sin factura"}
                    </span>
                  </label>
                </div>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
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
                    className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {copy.clientRequest.commissionDisclaimer(AGENT_COMMISSION_PCT + AFFILIATE_COMMISSION_PCT)}
                </p>
              </div>
            )}

            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

            <Button type="submit" size="md" disabled={pending} className="mt-1 font-display">
              {pending ? copy.clientRequest.submitting : copy.clientRequest.submit}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
