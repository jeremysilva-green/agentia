"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

// Builds a stable string key from an array so it can be compared by value
// below — `defaultValues` is a new array reference on every render even
// when its contents haven't changed. \u0000 is used as a separator (vs. a
// plain comma) so a value that itself contains a comma can't collide with
// another value's boundary.
function arrayKey(values: string[]): string {
  return values.join("\u0000");
}

export function MultiSelectDropdown({
  name,
  label,
  options,
  allLabel,
  defaultValues = [],
  buttonClassName,
  panelClassName,
  optionClassName,
  onChange,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel: string;
  defaultValues?: string[];
  buttonClassName?: string;
  panelClassName?: string;
  optionClassName?: string;
  onChange?: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(defaultValues);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // `defaultValues` only seeds initial state via useState above — it's not
  // otherwise a controlled prop, so a caller that mutates the selection
  // from outside (e.g. a "quick pick" preset button that isn't one of this
  // component's own checkboxes) would silently desync: the caller's own
  // display updates, but this component's internal `selected` — which is
  // what actually renders the submitted hidden inputs — doesn't. Re-synced
  // here whenever the defaultValues *content* changes, using React's
  // "adjust state during render" pattern (not an effect — this project's
  // lint config flags synchronous setState-in-effect) so `open` and every
  // other piece of local state is left untouched.
  const defaultValuesKey = arrayKey(defaultValues);
  const [prevDefaultValuesKey, setPrevDefaultValuesKey] = useState(defaultValuesKey);
  if (defaultValuesKey !== prevDefaultValuesKey) {
    setPrevDefaultValuesKey(defaultValuesKey);
    setSelected(defaultValuesKey === "" ? [] : defaultValuesKey.split("\u0000"));
  }

  const allSelected = selected.length === 0;

  return (
    <div ref={containerRef} className="relative">
      {selected.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-snow px-3 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-bone/30 focus:border-white focus:ring-2 focus:ring-white/40",
          buttonClassName
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-full z-20 mt-1.5 w-56 rounded-xl border border-bone bg-snow p-1.5 shadow-lg",
            panelClassName
          )}
        >
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50",
              optionClassName
            )}
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => {
                setSelected([]);
                onChange?.([]);
              }}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500"
            />
            {allLabel}
          </label>
          <div className="my-1 border-t border-slate-100" />
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50",
                optionClassName
              )}
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => {
                  const next = selected.includes(option.value)
                    ? selected.filter((v) => v !== option.value)
                    : [...selected, option.value];
                  setSelected(next);
                  onChange?.(next);
                }}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500"
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
