"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";
import { SingleSelectDropdown } from "@/components/ui/SingleSelectDropdown";
import { CITY_OPTIONS } from "@/lib/constants/cities";
import { PROPERTY_TYPE_VALUES, PROPERTY_TYPE_LABELS } from "@/lib/constants/propertyTypes";
import { cn } from "@/lib/cn";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";

export function FilterBar({ dict, locale }: { dict: Dictionary["home"]["filters"]; locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value.trim() !== "") {
        params.append(key, value);
      }
    }

    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  }

  function handleClear() {
    router.push(pathname);
    setIsOpen(false);
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="rounded-2xl border border-emerald-700 bg-emerald-600 font-rubik shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 p-4 text-sm font-medium text-white lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={16} />
          {dict.submit}
          {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        <ChevronDown size={16} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex-col gap-4 p-4 lg:flex lg:flex-row lg:flex-nowrap lg:items-center lg:gap-3 lg:p-3",
          isOpen ? "flex" : "hidden"
        )}
      >
        <div className="hidden items-center gap-2 text-sm font-medium text-white lg:flex">
          <SlidersHorizontal size={16} />
        </div>

        <div className="w-full lg:w-auto lg:min-w-0 lg:flex-1">
          <SingleSelectDropdown
            name="city"
            label={dict.city}
            allLabel={dict.all}
            defaultValue={searchParams.get("city") ?? ""}
            options={CITY_OPTIONS.map((city) => ({ value: city, label: city }))}
            buttonClassName="border-emerald-500! bg-white! hover:bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/30!"
            panelClassName="border-emerald-100! bg-emerald-50!"
          />
        </div>

        <div className="w-full lg:w-auto lg:min-w-0 lg:flex-1">
          <SingleSelectDropdown
            name="listingType"
            label={dict.listingType}
            allLabel={dict.all}
            defaultValue={searchParams.get("listingType") ?? ""}
            options={[{ value: "sale", label: dict.sale }]}
            showAllOption={false}
            buttonClassName="border-emerald-500! bg-white! hover:bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/30!"
            panelClassName="border-emerald-100! bg-emerald-50!"
          />
        </div>

        <div className="w-full lg:w-auto lg:min-w-0 lg:flex-1">
          <MultiSelectDropdown
            name="propertyType"
            label={dict.propertyType}
            allLabel={dict.all}
            defaultValues={searchParams.getAll("propertyType")}
            options={PROPERTY_TYPE_VALUES.map((value) => ({
              value,
              label: PROPERTY_TYPE_LABELS[value][locale],
            }))}
            buttonClassName="border-emerald-500! bg-white! hover:bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/30!"
            panelClassName="border-emerald-100! bg-emerald-50!"
          />
        </div>

        <div className="flex w-full gap-2 lg:w-auto lg:shrink-0">
          <Input
            name="minPrice"
            type="number"
            min="0"
            placeholder="Mín."
            defaultValue={searchParams.get("minPrice") ?? ""}
            className="bg-white! lg:w-24"
          />
          <Input
            name="maxPrice"
            type="number"
            min="0"
            placeholder="Máx."
            defaultValue={searchParams.get("maxPrice") ?? ""}
            className="bg-white! lg:w-24"
          />
        </div>

        <div className="flex w-full gap-2 lg:w-auto lg:shrink-0">
          <Button
            type="submit"
            size="md"
            className="w-full border! border-black! bg-black! text-white! hover:bg-white! hover:text-black! hover:shadow-none! lg:w-auto"
          >
            {dict.submit}
          </Button>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="w-full text-white! hover:bg-white/10! lg:w-auto"
              onClick={handleClear}
            >
              <X size={15} />
              {dict.clear}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
