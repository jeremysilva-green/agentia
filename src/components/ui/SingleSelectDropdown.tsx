"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function SingleSelectDropdown({
  name,
  label,
  options,
  allLabel = "",
  defaultValue = "",
  showAllOption = true,
  buttonClassName,
  panelClassName,
  onChange,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel?: string;
  defaultValue?: string;
  showAllOption?: boolean;
  buttonClassName?: string;
  panelClassName?: string;
  onChange?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(next: string) {
    setValue(next);
    setOpen(false);
    onChange?.(next);
  }

  const current = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative self-start w-full">
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-snow px-3 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-bone/30 focus:border-white focus:ring-2 focus:ring-white/40",
          buttonClassName
        )}
      >
        <span className="truncate">{current ? `${label}: ${current.label}` : label}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-full z-20 mt-1.5 max-h-72 w-56 overflow-y-auto rounded-xl border border-bone bg-snow p-1.5 shadow-lg",
            panelClassName
          )}
        >
          {showAllOption && (
            <>
              <button
                type="button"
                onClick={() => select("")}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    value === "" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                  )}
                >
                  {value === "" && <Check size={12} />}
                </span>
                {allLabel}
              </button>
              <div className="my-1 border-t border-slate-100" />
            </>
          )}
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => select(option.value)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  value === option.value ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                )}
              >
                {value === option.value && <Check size={12} />}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
