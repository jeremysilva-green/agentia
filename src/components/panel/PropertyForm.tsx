"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SingleSelectDropdown } from "@/components/ui/SingleSelectDropdown";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";
import { PillTabs } from "@/components/ui/PillTabs";
import { Button } from "@/components/ui/Button";
import { TypologyEditor, type TypologyRow } from "@/components/panel/TypologyEditor";
import { CITY_OPTIONS } from "@/lib/constants/cities";
import { COVERAGE_QUICK_PICKS } from "@/lib/constants/coverageCities";
import { LISTABLE_PROPERTY_TYPE_VALUES, PROPERTY_TYPE_LABELS } from "@/lib/constants/propertyTypes";
import { AGENT_COMMISSION_PCT, AFFILIATE_COMMISSION_PCT, MODELO_REFERRAL_REWARD_PCT } from "@/lib/constants/commission";
import { NEGOTIATION_OPTIONS } from "@/lib/constants/negotiation";
import {
  PROYECTO_EN_POZO_COMMISSION_TRIGGERS,
  MODELO_COMMISSION_TRIGGERS,
  ATTRIBUTION_WINDOW_OPTIONS,
} from "@/lib/constants/commissionTriggers";
import { cn } from "@/lib/cn";
import type { Property, PropertyTypology, PropertyCoverageCity } from "@/types/domain";
import type { PropertyActionState } from "@/lib/actions/properties";

type Action = (
  state: PropertyActionState,
  formData: FormData
) => Promise<PropertyActionState>;

const CURRENCIES = ["PYG", "USD"] as const;
type ListingKind = "standard" | "proyecto_en_pozo" | "modelo";

const LISTING_KIND_OPTIONS: { value: ListingKind; label: string }[] = [
  { value: "standard", label: "Propiedad" },
  { value: "proyecto_en_pozo", label: "Proyecto en pozo" },
  { value: "modelo", label: "Modelo de construcción" },
];

const CONSTRUCTION_STAGE_OPTIONS = [
  { value: "terminada", label: "Terminada" },
  { value: "en_construccion", label: "En construcción" },
  { value: "en_pozo", label: "En pozo (preventa)" },
];

const FINANCING_OPTIONS = [
  { value: "propia", label: "Propia" },
  { value: "bancaria", label: "Bancaria" },
  { value: "che_roga_pora", label: "Che Róga Porã" },
  { value: "no_ofrece", label: "No ofrece" },
];

const INCLUDES_LAND_OPTIONS = [
  { value: "no_terreno_cliente", label: "No, en el terreno del cliente" },
  { value: "si_incluido", label: "Sí, incluido" },
  { value: "opcional", label: "Opcional" },
];

const MODEL_FINANCING_TYPE_OPTIONS = [
  { value: "che_roga_pora", label: "Che Róga Porã" },
  { value: "bancaria", label: "Bancaria" },
  { value: "propia", label: "Propia" },
];

export function PropertyForm({
  action,
  defaultValues,
  defaultTypologies = [],
  defaultCoverageCities = [],
  submitLabel,
}: {
  action: Action;
  defaultValues?: Partial<Property>;
  defaultTypologies?: PropertyTypology[];
  defaultCoverageCities?: PropertyCoverageCity[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [kind, setKind] = useState<ListingKind>(
    (defaultValues?.listing_kind as ListingKind | undefined) ?? "standard"
  );
  const [constructionStage, setConstructionStage] = useState(defaultValues?.construction_stage ?? "terminada");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>(
    defaultValues?.currency === "USD" ? "USD" : "PYG"
  );
  const [price, setPrice] = useState(defaultValues?.price != null ? String(defaultValues.price) : "");
  const [withIva, setWithIva] = useState(defaultValues?.price_includes_iva ?? false);
  const [negotiationType, setNegotiationType] = useState<string[]>(defaultValues?.negotiation_type ?? []);
  const [financingOptions, setFinancingOptions] = useState<string[]>(
    defaultValues?.payment_plan_financing_options ?? []
  );
  const [coverageCities, setCoverageCities] = useState<string[]>(
    defaultCoverageCities.length > 0 ? defaultCoverageCities.map((c) => c.city) : []
  );
  const [includesLand, setIncludesLand] = useState(defaultValues?.model_includes_land ?? "no_terreno_cliente");
  const [modelFinancingType, setModelFinancingType] = useState(defaultValues?.model_financing_type ?? "che_roga_pora");
  const [referralRewardType, setReferralRewardType] = useState<"percentage" | "fixed">(
    defaultValues?.referral_reward_type ?? (kind === "modelo" ? "fixed" : "percentage")
  );
  // React resets uncontrolled <form> fields after every action call — even
  // when the action returns a validation error rather than throwing — so
  // text fields are controlled here to survive a failed submit.
  const [values, setValues] = useState<Record<string, string>>({
    title: defaultValues?.title ?? "",
    description: defaultValues?.description ?? "",
    address: defaultValues?.address ?? "",
    bedrooms: defaultValues?.bedrooms != null ? String(defaultValues.bedrooms) : "",
    bathrooms: defaultValues?.bathrooms != null ? String(defaultValues.bathrooms) : "",
    areaM2: defaultValues?.area_m2 != null ? String(defaultValues.area_m2) : "",
    mapsUrl: defaultValues?.maps_url ?? "",
    youtubeUrl: defaultValues?.youtube_url ?? "",
    instagramReelUrl: defaultValues?.instagram_reel_url ?? "",
    negotiationDetails: defaultValues?.negotiation_details ?? "",
    developerName: defaultValues?.developer_name ?? "",
    estimatedDeliveryDate: defaultValues?.estimated_delivery_date ?? "",
    constructionProgressPct: defaultValues?.construction_progress_pct != null ? String(defaultValues.construction_progress_pct) : "",
    totalUnits: defaultValues?.total_units != null ? String(defaultValues.total_units) : "",
    paymentPlanDepositPct: defaultValues?.payment_plan_deposit_pct != null ? String(defaultValues.payment_plan_deposit_pct) : "",
    paymentPlanInstallmentsText: defaultValues?.payment_plan_installments_text ?? "",
    paymentPlanBalancePct: defaultValues?.payment_plan_balance_pct != null ? String(defaultValues.payment_plan_balance_pct) : "",
    modelConstructionTermMonths: defaultValues?.model_construction_term_months != null ? String(defaultValues.model_construction_term_months) : "",
    modelMaterialsText: defaultValues?.model_materials_text ?? "",
    modelInstallmentFrom: defaultValues?.model_installment_from != null ? String(defaultValues.model_installment_from) : "",
    modelDownPaymentText: defaultValues?.model_down_payment_text ?? "",
    modelQualifyingRequirements: defaultValues?.model_qualifying_requirements ?? "",
    commissionTriggerLabel: defaultValues?.commission_trigger_label ?? "",
    commissionAgentPct: defaultValues?.commission_agent_pct != null ? String(defaultValues.commission_agent_pct) : "",
    referralRewardValue: defaultValues?.referral_reward_value != null ? String(defaultValues.referral_reward_value) : "",
  });
  const setField = (name: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }));
  const fieldError = (name: string) => state?.fieldErrors?.[name];

  function toggleIva(checked: boolean) {
    setWithIva(checked);
    setPrice((prev) => {
      const num = Number(prev) || 0;
      if (num === 0) return prev;
      const next = checked ? num * 1.1 : num / 1.1;
      return String(Math.round(next));
    });
  }

  const priceNum = Number(price) || 0;
  const agentCommission = priceNum * (AGENT_COMMISSION_PCT / 100);
  const affiliateCommission = priceNum * (AFFILIATE_COMMISSION_PCT / 100);
  // What the agent actually keeps if the sale comes through an affiliate's
  // referral — the worst case, since not every sale involves one.
  const netCommission = agentCommission - affiliateCommission;
  const formatMoney = (amount: number) =>
    `${currency} ${amount.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;

  const attributionDefault = kind === "modelo" ? "365" : "180";
  const commissionTriggerOptions = (
    kind === "modelo" ? MODELO_COMMISSION_TRIGGERS : PROYECTO_EN_POZO_COMMISSION_TRIGGERS
  ).map((t) => ({ value: t, label: t }));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <PillTabs
          options={LISTING_KIND_OPTIONS}
          value={kind}
          onChange={(v) => setKind(v as ListingKind)}
          className="self-start"
        />
        <input type="hidden" name="listingKind" value={kind} />
        {kind === "proyecto_en_pozo" && (
          <p className="text-xs text-slate-500">
            Proyecto en pozo = un edificio o complejo con dirección real que todavía no está terminado.
          </p>
        )}
        {kind === "modelo" && (
          <p className="text-xs text-slate-500">
            Un modelo no tiene dirección: se construye donde el cliente quiera, dentro de tu zona de cobertura. En la
            ficha pública se muestra como &quot;Construimos en tu terreno&quot;.
          </p>
        )}
      </div>

      <Input
        id="title"
        name="title"
        label={kind === "modelo" ? "Nombre del modelo" : "Título"}
        required
        value={values.title}
        onChange={setField("title")}
        error={fieldError("title")}
        placeholder="Casa 3 dormitorios en Villa Morra"
        className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
      />
      <Textarea
        id="description"
        name="description"
        label="Descripción"
        required
        value={values.description}
        onChange={setField("description")}
        error={fieldError("description")}
        placeholder="Contale al comprador por qué esta propiedad es especial..."
        className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
      />

      <input type="hidden" name="listingType" value={defaultValues?.listing_type ?? "sale"} />

      {(kind === "standard" || kind === "proyecto_en_pozo") && (
        <div className="flex flex-col gap-1.5">
          <SingleSelectDropdown
            name="constructionStage"
            label="Estado de la obra"
            showAllOption={false}
            defaultValue={constructionStage}
            onChange={(v) => setConstructionStage(v as typeof constructionStage)}
            options={CONSTRUCTION_STAGE_OPTIONS}
            buttonClassName="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
            panelClassName="border-slate-200! bg-slate-50!"
          />
          {kind === "standard" && (
            <p className="text-xs text-slate-500">También aparece en Propiedad, con &quot;Terminada&quot; por defecto.</p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <SingleSelectDropdown
          name="propertyType"
          label="Tipo de propiedad"
          showAllOption={false}
          defaultValue={defaultValues?.property_type ?? ""}
          options={[
            { value: "", label: "Sin especificar" },
            ...LISTABLE_PROPERTY_TYPE_VALUES.map((type) => ({
              value: type,
              label: PROPERTY_TYPE_LABELS[type].es,
            })),
          ]}
          buttonClassName="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
          panelClassName="border-slate-200! bg-slate-50!"
        />
        {kind !== "modelo" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="price" className="text-sm font-medium text-slate-700">
                {kind === "proyecto_en_pozo" ? "Precio desde" : "Precio"}
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                  <input
                    type="checkbox"
                    name="priceIncludesIva"
                    checked={withIva}
                    onChange={(e) => toggleIva(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500"
                  />
                  IVA (10%)
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
              placeholder="sin puntos ni comas"
              className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
            />
            {/* Proyecto en Pozo sets its own commission % below, in "Comisión
                y referidos" — the standard 5.5%/1% preview doesn't apply
                there and would be misleading shown twice. */}
            {kind === "standard" && (
              <div className="flex flex-col gap-1 pt-1 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Comisión Agente ({AGENT_COMMISSION_PCT}%)</span>
                  <span className="font-medium text-slate-700">{formatMoney(agentCommission)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Comisión Referido ({AFFILIATE_COMMISSION_PCT}%)</span>
                  <span className="font-medium text-slate-700">{formatMoney(affiliateCommission)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-1">
                  <span className="font-medium text-slate-700">Tu comisión total</span>
                  <span className="font-semibold text-emerald-700">{formatMoney(netCommission)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {kind === "proyecto_en_pozo" && (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Input
            id="developerName"
            name="developerName"
            label="Desarrolladora / constructora"
            value={values.developerName}
            onChange={setField("developerName")}
            error={fieldError("developerName")}
            className="bg-white!"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="estimatedDeliveryDate"
              name="estimatedDeliveryDate"
              type="date"
              label="Entrega estimada"
              value={values.estimatedDeliveryDate}
              onChange={setField("estimatedDeliveryDate")}
              className="bg-white!"
            />
            <Input
              id="constructionProgressPct"
              name="constructionProgressPct"
              type="number"
              min="0"
              max="100"
              label="Avance de obra (%)"
              value={values.constructionProgressPct}
              onChange={setField("constructionProgressPct")}
              className="bg-white!"
            />
            <Input
              id="totalUnits"
              name="totalUnits"
              type="number"
              min="0"
              label="Unidades totales"
              value={values.totalUnits}
              onChange={setField("totalUnits")}
              className="bg-white!"
            />
          </div>

          <TypologyEditor
            defaultRows={defaultTypologies.map((t): TypologyRow => ({
              name: t.name,
              bedrooms: t.bedrooms != null ? String(t.bedrooms) : "",
              areaM2: t.area_m2 != null ? String(t.area_m2) : "",
              priceFrom: t.price_from != null ? String(t.price_from) : "",
              unitsAvailable: t.units_available != null ? String(t.units_available) : "",
            }))}
          />
          {fieldError("typologyName") && <p className="text-xs text-red-600">{fieldError("typologyName")}</p>}

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-700">Plan de pago</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="paymentPlanDepositPct"
                name="paymentPlanDepositPct"
                type="number"
                min="0"
                max="100"
                label="Anticipo (%)"
                value={values.paymentPlanDepositPct}
                onChange={setField("paymentPlanDepositPct")}
                className="bg-white!"
              />
              <Input
                id="paymentPlanBalancePct"
                name="paymentPlanBalancePct"
                type="number"
                min="0"
                max="100"
                label="Saldo a la entrega (%)"
                value={values.paymentPlanBalancePct}
                onChange={setField("paymentPlanBalancePct")}
                className="bg-white!"
              />
            </div>
            <Input
              id="paymentPlanInstallmentsText"
              name="paymentPlanInstallmentsText"
              label="Cuotas durante la obra"
              placeholder="ej: 24 cuotas mensuales"
              value={values.paymentPlanInstallmentsText}
              onChange={setField("paymentPlanInstallmentsText")}
              className="bg-white!"
            />
            <MultiSelectDropdown
              name="paymentPlanFinancingOptions"
              label="Financiación para el saldo"
              allLabel="Ninguna seleccionada"
              defaultValues={financingOptions}
              options={FINANCING_OPTIONS}
              onChange={setFinancingOptions}
              buttonClassName="bg-white!"
            />
          </div>
        </div>
      )}

      {kind === "modelo" && (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Zona de cobertura</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                REEMPLAZA DIRECCIÓN
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COVERAGE_QUICK_PICKS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setCoverageCities((prev) => Array.from(new Set([...prev, ...preset.cities])))
                  }
                  className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <MultiSelectDropdown
              name="coverageCities"
              label="Ciudades incluidas"
              allLabel="Ninguna seleccionada"
              defaultValues={coverageCities}
              options={CITY_OPTIONS.map((city) => ({ value: city, label: city }))}
              onChange={setCoverageCities}
              buttonClassName="bg-white!"
            />
            {coverageCities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {coverageCities.map((city) => (
                  <span
                    key={city}
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800"
                  >
                    {city}
                    <button
                      type="button"
                      onClick={() => setCoverageCities((prev) => prev.filter((c) => c !== city))}
                      className="text-emerald-500 hover:text-emerald-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {fieldError("coverageCities") && <p className="text-xs text-red-600">{fieldError("coverageCities")}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="0"
              label="Dormitorios"
              value={values.bedrooms}
              onChange={setField("bedrooms")}
              className="bg-white!"
            />
            <Input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min="0"
              label="Baños"
              value={values.bathrooms}
              onChange={setField("bathrooms")}
              className="bg-white!"
            />
            <Input
              id="areaM2"
              name="areaM2"
              type="number"
              min="0"
              label="M² construidos"
              value={values.areaM2}
              onChange={setField("areaM2")}
              className="bg-white!"
            />
            <Input
              id="modelConstructionTermMonths"
              name="modelConstructionTermMonths"
              type="number"
              min="0"
              label="Plazo de obra (meses)"
              value={values.modelConstructionTermMonths}
              onChange={setField("modelConstructionTermMonths")}
              className="bg-white!"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-slate-700">¿Incluye terreno?</p>
            <PillTabs
              options={INCLUDES_LAND_OPTIONS}
              value={includesLand}
              onChange={(v) => setIncludesLand(v as typeof includesLand)}
              className="self-start"
            />
            <input type="hidden" name="modelIncludesLand" value={includesLand} />
          </div>

          <Textarea
            id="modelMaterialsText"
            name="modelMaterialsText"
            label="Materiales y terminaciones"
            value={values.modelMaterialsText}
            onChange={setField("modelMaterialsText")}
            className="bg-white!"
          />

          <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-emerald-900">Financiación</p>
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                PRECIO POR CUOTA
              </span>
            </div>
            <p className="text-xs text-emerald-700">En la ficha pública se muestra la cuota, no el precio contado.</p>
            <PillTabs
              options={MODEL_FINANCING_TYPE_OPTIONS}
              value={modelFinancingType}
              onChange={(v) => setModelFinancingType(v as typeof modelFinancingType)}
              className="self-start"
            />
            <input type="hidden" name="modelFinancingType" value={modelFinancingType} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                id="modelInstallmentFrom"
                name="modelInstallmentFrom"
                type="number"
                min="0"
                label="Cuota desde (Gs./mes)"
                value={values.modelInstallmentFrom}
                onChange={setField("modelInstallmentFrom")}
                className="bg-white!"
              />
              <Input
                id="modelDownPaymentText"
                name="modelDownPaymentText"
                label="Entrega inicial"
                placeholder="Gs. o % del contrato"
                value={values.modelDownPaymentText}
                onChange={setField("modelDownPaymentText")}
                className="bg-white!"
              />
            </div>
            <Textarea
              id="modelQualifyingRequirements"
              name="modelQualifyingRequirements"
              label="Requisitos para calificar"
              value={values.modelQualifyingRequirements}
              onChange={setField("modelQualifyingRequirements")}
              className="bg-white!"
            />
            <p className="text-xs text-emerald-700">El asistente de chat lo usa para precalificar.</p>
          </div>

          {/* Precio contado — private, see "Datos privados" box below for the amber styling convention */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <label htmlFor="price" className="text-sm font-medium text-amber-900">
              Precio contado (privado)
            </label>
            <p className="text-xs text-amber-700">
              Nunca se muestra en la ficha pública — solo lo usa el asistente de chat para precalificar y vos, en el
              panel.
            </p>
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
              className="bg-white!"
            />
          </div>
        </div>
      )}

      {(kind === "proyecto_en_pozo" || kind === "modelo") && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Comisión y referidos</p>
            <p className="text-xs text-slate-500">
              {kind === "proyecto_en_pozo"
                ? "En proyectos, la comisión la paga la desarrolladora y suele ser distinta al 5%."
                : "Como no hay precio público, el referido ve un monto fijo."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="commissionAgentPct"
              name="commissionAgentPct"
              type="number"
              min="0"
              max="100"
              step="0.01"
              label={kind === "modelo" ? "Tu comisión por contrato (% o Gs.)" : "Tu comisión (%)"}
              value={values.commissionAgentPct}
              onChange={setField("commissionAgentPct")}
              className="bg-white!"
            />
            <SingleSelectDropdown
              name="commissionTriggerLabel"
              label="Se cobra cuando"
              showAllOption={false}
              defaultValue={defaultValues?.commission_trigger_label ?? ""}
              options={commissionTriggerOptions}
              onChange={(v) => setValues((prev) => ({ ...prev, commissionTriggerLabel: v }))}
              buttonClassName="bg-white!"
            />
          </div>
          <div className={`grid gap-4 ${kind === "modelo" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            {kind === "modelo" ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-slate-700">Recompensa para el referido</p>
                <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-600">
                  {MODELO_REFERRAL_REWARD_PCT}% del precio de venta (fijo)
                </div>
                <input type="hidden" name="referralRewardType" value="percentage" />
                <input type="hidden" name="referralRewardValue" value={MODELO_REFERRAL_REWARD_PCT} />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium text-slate-700">Recompensa para el referido</p>
                  <PillTabs
                    options={[
                      { value: "percentage", label: "% de tu comisión" },
                      { value: "fixed", label: "Monto fijo" },
                    ]}
                    value={referralRewardType}
                    onChange={(v) => setReferralRewardType(v as "percentage" | "fixed")}
                    className="self-start"
                  />
                  <input type="hidden" name="referralRewardType" value={referralRewardType} />
                </div>
                <Input
                  id="referralRewardValue"
                  name="referralRewardValue"
                  type="number"
                  min="0"
                  step="0.01"
                  label={referralRewardType === "fixed" ? "Monto para el referido (Gs.)" : "Porcentaje para el referido"}
                  value={values.referralRewardValue}
                  onChange={setField("referralRewardValue")}
                  className="bg-white!"
                />
              </>
            )}
            <SingleSelectDropdown
              name="referralAttributionDays"
              label="Ventana de atribución"
              showAllOption={false}
              defaultValue={
                defaultValues?.referral_attribution_days != null
                  ? String(defaultValues.referral_attribution_days)
                  : attributionDefault
              }
              options={ATTRIBUTION_WINDOW_OPTIONS}
              buttonClassName="bg-white!"
            />
          </div>
          <p className="text-xs text-slate-500">
            {kind === "modelo"
              ? `El referido cobra el ${MODELO_REFERRAL_REWARD_PCT}% del precio de venta (se descuenta de tu comisión) cuando se cumpla "${values.commissionTriggerLabel || "la condición acordada"}" con alguien que llegó por su link, hasta ${attributionDefault} días después del primer contacto.`
              : referralRewardType === "fixed"
                ? `El referido cobra ${currency} ${(Number(values.referralRewardValue) || 0).toLocaleString("es-PY")} cuando se cumpla "${values.commissionTriggerLabel || "la condición acordada"}" con alguien que llegó por su link, hasta ${attributionDefault} días después del primer contacto.`
                : `El referido cobra cuando se cumpla "${values.commissionTriggerLabel || "la condición acordada"}" de una unidad vendida a alguien que llegó por su link, hasta ${attributionDefault} días después del primer contacto.`}
          </p>
        </div>
      )}

      {kind !== "modelo" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Ciudad</label>
            <SingleSelectDropdown
              name="city"
              label="Ciudad"
              showAllOption={false}
              defaultValue={defaultValues?.city ?? ""}
              options={[
                ...(defaultValues?.city && !CITY_OPTIONS.includes(defaultValues.city)
                  ? [{ value: defaultValues.city, label: defaultValues.city }]
                  : []),
                ...CITY_OPTIONS.map((city) => ({ value: city, label: city })),
              ]}
              error={fieldError("city")}
              buttonClassName="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
              panelClassName="border-slate-200! bg-slate-50!"
            />
          </div>
          <Input
            id="address"
            name="address"
            label="Dirección"
            value={values.address}
            onChange={setField("address")}
            error={fieldError("address")}
            className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
          />
        </div>
      )}

      {kind === "standard" && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min="0"
            step="1"
            label="Habitaciones"
            value={values.bedrooms}
            onChange={setField("bedrooms")}
            error={fieldError("bedrooms")}
            className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
          />
          <Input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min="0"
            step="1"
            label="Baños"
            value={values.bathrooms}
            onChange={setField("bathrooms")}
            error={fieldError("bathrooms")}
            className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
          />
          <Input
            id="areaM2"
            name="areaM2"
            type="number"
            min="0"
            step="0.01"
            label="M²"
            value={values.areaM2}
            onChange={setField("areaM2")}
            error={fieldError("areaM2")}
            className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
          />
          <SingleSelectDropdown
            name="garage"
            label="Garage"
            showAllOption={false}
            defaultValue={defaultValues?.garage ? "true" : "false"}
            options={[
              { value: "false", label: "No" },
              { value: "true", label: "Sí" },
            ]}
            buttonClassName="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
            panelClassName="border-slate-200! bg-slate-50!"
          />
        </div>
      )}

      {kind !== "modelo" && (
        <div className="flex flex-col gap-1.5">
          <Input
            id="mapsUrl"
            name="mapsUrl"
            label="Enlace de Google Maps"
            placeholder="https://maps.app.goo.gl/..."
            value={values.mapsUrl}
            onChange={setField("mapsUrl")}
            error={fieldError("mapsUrl")}
            className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
          />
          <p className="text-xs text-slate-500">
            Pegá el enlace para compartir de Google Maps — lo usamos para el mapa en la ficha de la propiedad.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Input
          id="youtubeUrl"
          name="youtubeUrl"
          label="Video de YouTube"
          placeholder="https://www.youtube.com/watch?v=..."
          value={values.youtubeUrl}
          onChange={setField("youtubeUrl")}
          error={fieldError("youtubeUrl")}
          className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
        />
        <p className="text-xs text-slate-500">
          Opcional — se muestra en la ficha de la propiedad junto a las fotos.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          id="instagramReelUrl"
          name="instagramReelUrl"
          label="Video de Instagram (Reel)"
          placeholder="https://www.instagram.com/reel/..."
          value={values.instagramReelUrl}
          onChange={setField("instagramReelUrl")}
          error={fieldError("instagramReelUrl")}
          className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
        />
        <p className="text-xs text-slate-500">
          Opcional — se muestra en la ficha de la propiedad junto a las fotos.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div>
          <p className="text-sm font-semibold text-amber-900">Tipo de negociación (privado)</p>
          <p className="text-xs text-amber-700">
            Esta información nunca se muestra en la ficha pública de la propiedad. Solo la usa el asistente de chat
            para responder si preguntan por permuta, canje o forma de pago — y vos, en el panel.
          </p>
        </div>
        <MultiSelectDropdown
          name="negotiationType"
          label="Tipo de negociación"
          allLabel="Ninguna seleccionada"
          defaultValues={defaultValues?.negotiation_type ?? []}
          options={NEGOTIATION_OPTIONS}
          onChange={setNegotiationType}
          buttonClassName="bg-white! focus:border-amber-600! focus:ring-amber-500/20!"
          panelClassName="border-amber-100! bg-white!"
        />
        {negotiationType.includes("canje_permuta") && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="negotiationDetails" className="text-xs font-medium text-amber-800">
              ¿Qué acepta en la permuta? (ej: terreno, auto, o combinación con efectivo)
            </label>
            <Textarea
              id="negotiationDetails"
              name="negotiationDetails"
              value={values.negotiationDetails}
              onChange={setField("negotiationDetails")}
              className="bg-white! focus:border-amber-600! focus:ring-amber-500/20!"
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SingleSelectDropdown
          name="status"
          label="Estado"
          showAllOption={false}
          defaultValue={defaultValues?.status ?? "available"}
          options={[
            { value: "available", label: "Disponible" },
            { value: "sold", label: "Vendida" },
            { value: "draft", label: "Borrador" },
          ]}
          buttonClassName="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
          panelClassName="border-slate-200! bg-slate-50!"
        />
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="published"
            defaultChecked={defaultValues?.published ?? true}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500"
          />
          Publicada (visible en el sitio)
        </label>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="self-start bg-emerald-600! text-white! hover:bg-emerald-700!"
      >
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
