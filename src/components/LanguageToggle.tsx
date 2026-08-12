"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/actions/locale";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LanguageToggle({ locale }: { locale: Locale }) {
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: Locale) {
    if (next === locale || isPending) return;
    startTransition(() => setLocale(next));
  }

  return (
    <div className="flex items-center rounded-md border border-white/30 p-0.5 text-xs font-medium">
      {(["es", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => handleSelect(option)}
          className={cn(
            "rounded px-2 py-1 uppercase transition-colors",
            locale === option ? "bg-sage text-prussian" : "text-white/70 hover:text-white"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
