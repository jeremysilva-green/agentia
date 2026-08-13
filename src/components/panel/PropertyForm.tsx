"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SingleSelectDropdown } from "@/components/ui/SingleSelectDropdown";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";
import { Button } from "@/components/ui/Button";
import { CITY_OPTIONS } from "@/lib/constants/cities";
import { PROPERTY_TYPE_VALUES, PROPERTY_TYPE_LABELS } from "@/lib/constants/propertyTypes";
import { AGENT_COMMISSION_PCT, AFFILIATE_COMMISSION_PCT } from "@/lib/constants/commission";
import { NEGOTIATION_OPTIONS } from "@/lib/constants/negotiation";
import { cn } from "@/lib/cn";
import type { Property } from "@/types/domain";
import type { PropertyActionState } from "@/lib/actions/properties";

type Action = (
  state: PropertyActionState,
  formData: FormData
) => Promise<PropertyActionState>;

const CURRENCIES = ["PYG", "USD"] as const;

export function PropertyForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: Action;
  defaultValues?: Partial<Property>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>(
    defaultValues?.currency === "USD" ? "USD" : "PYG"
  );
  const [price, setPrice] = useState(defaultValues?.price != null ? String(defaultValues.price) : "");
  const [withIva, setWithIva] = useState(false);
  const [negotiationType, setNegotiationType] = useState<string[]>(defaultValues?.negotiation_type ?? []);

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
  const formatMoney = (amount: number) =>
    `${currency} ${amount.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        id="title"
        name="title"
        label="Título"
        required
        defaultValue={defaultValues?.title}
        placeholder="Casa 3 dormitorios en Villa Morra"
        className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
      />
      <Textarea
        id="description"
        name="description"
        label="Descripción"
        required
        defaultValue={defaultValues?.description}
        placeholder="Contale al comprador por qué esta propiedad es especial..."
        className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
      />

      <input type="hidden" name="listingType" value={defaultValues?.listing_type ?? "sale"} />

      <div className="grid gap-4 sm:grid-cols-2">
        <SingleSelectDropdown
          name="propertyType"
          label="Tipo de propiedad"
          showAllOption={false}
          defaultValue={defaultValues?.property_type ?? ""}
          options={[
            { value: "", label: "Sin especificar" },
            ...PROPERTY_TYPE_VALUES.map((type) => ({ value: type, label: PROPERTY_TYPE_LABELS[type].es })),
          ]}
          buttonClassName="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
          panelClassName="border-emerald-100! bg-emerald-50!"
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="price" className="text-sm font-medium text-slate-700">
              Precio
            </label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                <input
                  type="checkbox"
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
            className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
          />
          <div className="flex flex-col gap-1 pt-1 text-xs text-slate-500">
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
      </div>

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
            buttonClassName="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
            panelClassName="border-emerald-100! bg-emerald-50!"
          />
        </div>
        <Input
          id="address"
          name="address"
          label="Dirección"
          defaultValue={defaultValues?.address ?? ""}
          className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Input
          id="bedrooms"
          name="bedrooms"
          type="number"
          min="0"
          step="1"
          label="Habitaciones"
          defaultValue={defaultValues?.bedrooms ?? ""}
          className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
        />
        <Input
          id="bathrooms"
          name="bathrooms"
          type="number"
          min="0"
          step="1"
          label="Baños"
          defaultValue={defaultValues?.bathrooms ?? ""}
          className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
        />
        <Input
          id="areaM2"
          name="areaM2"
          type="number"
          min="0"
          step="0.01"
          label="M²"
          defaultValue={defaultValues?.area_m2 ?? ""}
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
          panelClassName="border-emerald-100! bg-emerald-50!"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          id="mapsUrl"
          name="mapsUrl"
          label="Enlace de Google Maps"
          placeholder="https://maps.app.goo.gl/..."
          defaultValue={defaultValues?.maps_url ?? ""}
          className="bg-white! focus:border-emerald-600! focus:ring-emerald-500/20!"
        />
        <p className="text-xs text-slate-500">
          Pegá el enlace para compartir de Google Maps — lo usamos para el mapa en la ficha de la propiedad.
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
              defaultValue={defaultValues?.negotiation_details ?? ""}
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
          panelClassName="border-emerald-100! bg-emerald-50!"
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
