"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function ReadMoreText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Descripción</h2>
      <div className="relative overflow-hidden transition-[max-height] duration-500" style={{ maxHeight: open ? 1200 : 150 }}>
        <p className="max-w-2xl whitespace-pre-line break-words text-[15px] leading-relaxed text-white/70">{text}</p>
        {!open && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#161616] to-transparent" />
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
      >
        {open ? "Leer menos" : "Leer más"}
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    </section>
  );
}
