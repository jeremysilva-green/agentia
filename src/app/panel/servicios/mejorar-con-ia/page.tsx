import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

// Stub — the real AI image-enhancement flow will replace this once its
// spec is provided. Exists so the "Mejorar con IA" link from /panel/servicios
// has somewhere real to go instead of 404ing.
export default function MejorarConIaPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/panel/servicios" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} />
        Volver a Servicios
      </Link>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-700 bg-neutral-950 px-6 py-16 text-center">
        <Sparkles size={32} className="text-emerald-400" />
        <h1 className="font-display text-xl font-semibold text-white">Mejorar con IA</h1>
        <p className="max-w-sm text-sm text-slate-400">Esta función todavía está en construcción. Muy pronto vas a poder mejorar tus fotos con inteligencia artificial desde acá.</p>
      </div>
    </div>
  );
}
