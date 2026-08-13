"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function MultiSelectDropdown({
  name,
  label,
  options,
  allLabel,
  defaultValues = [],
  buttonClassName,
  panelClassName,
  onChange,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel: string;
  defaultValues?: string[];
  buttonClassName?: string;
  panelClassName?: string;
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
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50">
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
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() =>
                  setSelected((prev) => {
                    const next = prev.includes(option.value)
                      ? prev.filter((v) => v !== option.value)
                      : [...prev, option.value];
                    onChange?.(next);
                    return next;
                  })
                }
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
