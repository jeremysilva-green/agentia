"use client";

import { FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";
import { SingleSelectDropdown } from "@/components/ui/SingleSelectDropdown";
import { CITY_OPTIONS } from "@/lib/constants/cities";
import { PROPERTY_TYPE_VALUES, PROPERTY_TYPE_LABELS } from "@/lib/constants/propertyTypes";
import { copy } from "@/lib/copy";

export function PropertyFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value.trim() !== "") params.append(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-neutral-700 bg-neutral-800 p-4 font-rubik shadow-sm sm:flex-row sm:flex-nowrap sm:items-end"
    >
      <div className="w-full sm:w-auto sm:min-w-0 sm:flex-1">
        <SingleSelectDropdown
          name="city"
          label={copy.home.filters.city}
          allLabel={copy.home.filters.all}
          defaultValue={searchParams.get("city") ?? ""}
          options={CITY_OPTIONS.map((city) => ({ value: city, label: city }))}
          buttonClassName="border-emerald-500! hover:bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/30!"
          panelClassName="border-emerald-100! bg-emerald-50!"
        />
      </div>

      <div className="w-full sm:w-auto sm:min-w-0 sm:flex-1">
        <MultiSelectDropdown
          name="propertyType"
          label={copy.home.filters.propertyType}
          allLabel={copy.home.filters.all}
          defaultValues={searchParams.getAll("propertyType")}
          options={PROPERTY_TYPE_VALUES.map((value) => ({
            value,
            label: PROPERTY_TYPE_LABELS[value].es,
          }))}
          buttonClassName="border-emerald-500! hover:bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/30!"
          panelClassName="border-emerald-100! bg-emerald-50!"
        />
      </div>

      <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
        <Button
          type="submit"
          size="md"
          className="flex-1 border! border-emerald-600! bg-emerald-600! text-white! hover:bg-emerald-700! sm:flex-none"
        >
          Filtrar
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="text-white! hover:bg-white/10!"
            onClick={() => router.push(pathname)}
          >
            <X size={15} />
            {copy.home.filters.clear}
          </Button>
        )}
      </div>
    </form>
  );
}
