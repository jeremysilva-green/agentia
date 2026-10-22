"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Building2, Banknote, SlidersHorizontal, X } from "lucide-react";
import { SingleSelectDropdown } from "@/components/ui/SingleSelectDropdown";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";
import { CITY_OPTIONS } from "@/lib/constants/cities";
import { LISTABLE_PROPERTY_TYPE_VALUES, PROPERTY_TYPE_LABELS } from "@/lib/constants/propertyTypes";
import type { Locale } from "@/lib/i18n/dictionaries";

const DEBOUNCE_MS = 300;
const dropdownClass = "border-[var(--line)]! bg-black/30! text-white! focus:border-[var(--em)]! focus:ring-[var(--em)]/20!";
const dropdownPanelClass = "border-[var(--line)]! bg-[var(--ink-2)]!";
const dropdownOptionClass = "text-white! hover:bg-white/10!";

function formatGs(digits: string) {
  return digits ? `Gs. ${Number(digits).toLocaleString("es-PY")}` : "";
}

export function MarketplaceSearchPanel({
  locale,
  placeholder = "Buscá por nombre de agente, ciudad, categoría o palabra clave...",
}: {
  locale: Locale;
  // Only an additive override — the main marketplace page (which doesn't
  // pass it) keeps its original copy; the single-agent portfolio page
  // passes its own, narrower placeholder instead.
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [minPriceDisplay, setMinPriceDisplay] = useState(formatGs(searchParams.get("minPrice") ?? ""));
  const [maxPriceDisplay, setMaxPriceDisplay] = useState(formatGs(searchParams.get("maxPrice") ?? ""));
  const minPriceRef = useRef<HTMLInputElement>(null);
  const maxPriceRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function navigateQ(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = next.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleQChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setQ(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigateQ(next), DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handlePriceInput(display: string, setDisplay: (v: string) => void, hidden: HTMLInputElement | null) {
    const digits = display.replace(/\D/g, "");
    setDisplay(formatGs(digits));
    if (hidden) hidden.value = digits;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());
    // q isn't part of this form (it's its own live-debounced field) — keep
    // whatever's already in the URL for it.
    for (const key of ["city", "propertyType", "minPrice", "maxPrice"]) params.delete(key);
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value.trim() !== "") params.append(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function removeParam(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== undefined) {
      const remaining = params.getAll(key).filter((v) => v !== value);
      params.delete(key);
      remaining.forEach((v) => params.append(key, v));
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeCity = searchParams.get("city") ?? "";
  const activeTypes = searchParams.getAll("propertyType");
  const activeMin = searchParams.get("minPrice") ?? "";
  const activeMax = searchParams.get("maxPrice") ?? "";
  const hasChips = Boolean(activeCity || activeTypes.length > 0 || activeMin || activeMax);

  return (
    <div className="market-rv flex flex-col gap-3">
      <div className="relative isolate rounded-[28px] p-[2px]">
        {/* Dedicated clipping box for just the spinning gradient — the real
            content below is a separate sibling with no overflow:hidden, so
            a dropdown's open options panel can render outside this box
            without being clipped along with the decorative border. */}
        <div className="absolute inset-0 overflow-hidden rounded-[28px]" aria-hidden>
          <div
            className="market-spin absolute -inset-[80%]"
            style={{
              background:
                "conic-gradient(from 0deg, #0a8f5c, #13c47f 15%, transparent 30%, transparent 65%, #13c47f 85%, #0a8f5c)",
              opacity: 0.8,
            }}
          />
        </div>
        <div className="relative rounded-[26px] bg-[#151515f0] p-3.5 backdrop-blur-md">
          <label className="relative flex h-[62px] items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ink)] px-5 transition-colors focus-within:border-[var(--em)] focus-within:ring-4 focus-within:ring-[#13c47f1f]">
            <Search size={21} className="shrink-0 text-[var(--em-2)]" />
            <input
              type="text"
              value={q}
              onChange={handleQChange}
              placeholder={placeholder}
              className="h-full flex-1 bg-transparent text-[16.5px] text-white placeholder:text-[#6a6a6a] focus:outline-none"
            />
          </label>

          <form onSubmit={handleSubmit} className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1.3fr_auto]">
            <SingleSelectDropdown
              name="city"
              label="Ciudad"
              allLabel="Todas"
              defaultValue={activeCity}
              options={CITY_OPTIONS.map((city) => ({ value: city, label: city }))}
              buttonClassName={dropdownClass}
              panelClassName={dropdownPanelClass}
              optionClassName={dropdownOptionClass}
            />
            <MultiSelectDropdown
              name="propertyType"
              label="Tipo de Propiedad"
              allLabel="Todos"
              defaultValues={activeTypes}
              options={LISTABLE_PROPERTY_TYPE_VALUES.map((value) => ({
                value,
                label: PROPERTY_TYPE_LABELS[value][locale],
              }))}
              buttonClassName={dropdownClass}
              panelClassName={dropdownPanelClass}
              optionClassName={dropdownOptionClass}
            />
            <div className="flex h-[52px] items-center gap-2 rounded-[15px] border border-[var(--line)] bg-black/30 px-3.5 transition-colors focus-within:border-[var(--em)] focus-within:ring-4 focus-within:ring-[#13c47f1f]">
              <Banknote size={16} className="shrink-0 text-[var(--em-2)]" />
              <input
                ref={minPriceRef}
                value={minPriceDisplay}
                onChange={(e) => handlePriceInput(e.target.value, setMinPriceDisplay, minPriceRef.current)}
                placeholder="Gs. Mín."
                className="w-full min-w-0 bg-transparent text-[14.5px] font-semibold text-white placeholder:font-medium placeholder:text-[#6a6a6a] focus:outline-none"
              />
              <span className="text-[#555]">–</span>
              <input
                ref={maxPriceRef}
                value={maxPriceDisplay}
                onChange={(e) => handlePriceInput(e.target.value, setMaxPriceDisplay, maxPriceRef.current)}
                placeholder="Gs. Máx."
                className="w-full min-w-0 bg-transparent text-[14.5px] font-semibold text-white placeholder:font-medium placeholder:text-[#6a6a6a] focus:outline-none"
              />
              <input type="hidden" name="minPrice" defaultValue={activeMin} />
              <input type="hidden" name="maxPrice" defaultValue={activeMax} />
            </div>
            <button
              type="submit"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[15px] bg-[var(--em)] px-6 text-[15px] font-bold text-white shadow-[0_12px_30px_-12px_var(--em-glow)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[var(--em-2)]"
            >
              <SlidersHorizontal size={18} />
              Filtrar
            </button>
          </form>
        </div>
      </div>

      {hasChips && (
        <div className="flex flex-wrap items-center gap-2 px-0.5">
          {activeCity && (
            <Chip label={activeCity} icon={<MapPin size={12} />} onRemove={() => removeParam("city")} />
          )}
          {activeTypes.map((t) => (
            <Chip
              key={t}
              label={PROPERTY_TYPE_LABELS[t as keyof typeof PROPERTY_TYPE_LABELS]?.[locale] ?? t}
              icon={<Building2 size={12} />}
              onRemove={() => removeParam("propertyType", t)}
            />
          ))}
          {(activeMin || activeMax) && (
            <Chip
              label={`${activeMin ? formatGs(activeMin) : "Gs. 0"} – ${activeMax ? formatGs(activeMax) : "sin máximo"}`}
              icon={<Banknote size={12} />}
              onRemove={() => {
                removeParam("minPrice");
                removeParam("maxPrice");
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ label, icon, onRemove }: { label: string; icon: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="market-pop inline-flex h-8 items-center gap-1.5 rounded-full border border-[#13c47f55] bg-[#13c47f17] pr-1.5 pl-3 text-[12.5px] font-semibold text-[var(--em-2)]">
      {icon}
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="grid h-5 w-5 place-items-center rounded-full text-[var(--em-2)] hover:bg-[#13c47f33]"
      >
        <X size={12} />
      </button>
    </span>
  );
}
