"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PLANS } from "@/lib/plans";

export function NuevaPropiedadButton({ atLimit }: { atLimit: boolean }) {
  const [showModal, setShowModal] = useState(false);

  if (!atLimit) {
    return (
      <Link href="/panel/propiedades/nueva">
        <Button size="sm" className="bg-emerald-600! hover:bg-emerald-700!">
          <Plus size={16} />
          Nueva propiedad
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Button size="sm" className="bg-emerald-600! hover:bg-emerald-700!" onClick={() => setShowModal(true)}>
        <Plus size={16} />
        Nueva propiedad
      </Button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-emerald-400 bg-black/80 p-5 shadow-xl backdrop-blur-md ring-1 ring-emerald-400"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-white"
            >
              <X size={18} />
            </button>

            <p className="text-[10px] font-medium tracking-widest text-emerald-300/80">{PLANS.pro.eyebrow}</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Alcanzaste el límite del plan Básico</h2>
            <p className="mt-2 text-sm text-slate-300">
              Tu plan Básico permite hasta 3 propiedades activas. Actualizá a Pro para publicar sin límites.
            </p>

            <div className="mt-4 rounded-xl border border-emerald-500/40 bg-white/5 p-3">
              <p className="text-2xl font-bold text-white">Gs. {PLANS.pro.price.toLocaleString("es-PY")}</p>
              <p className="text-xs text-slate-400">/mes</p>
              <p className="mt-1 text-xs text-slate-300">Propiedades ilimitadas y todas las herramientas Pro.</p>
            </div>

            <Link href="/panel/suscripcion" className="mt-4 block">
              <button
                type="button"
                className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
              >
                Actualizar a Pro
              </button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
