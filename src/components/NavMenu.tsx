"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, MessageCircle, Info, Trophy } from "lucide-react";

export function NavMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Más opciones"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/90 transition-colors hover:border-emerald-400 hover:text-emerald-400 sm:h-10 sm:w-10"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-emerald-500/40 bg-black/95 p-1.5 shadow-lg backdrop-blur-md">
          <Link
            href="/que-es-agentia"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Info size={16} />
            ¿Qué es Agentia?
          </Link>
          <Link
            href="/ranking-afiliados"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Trophy size={16} />
            Ranking de Afiliados
          </Link>
          <a
            href="https://chat.whatsapp.com/BahpSvfmwIGLj7fSkAGijz"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/10"
          >
            <MessageCircle size={16} />
            Comunidad WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
