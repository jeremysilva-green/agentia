import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { ReactCompareSlider } from "react-compare-slider";

function SlideLabel({ label, side }: { label: string; side: "left" | "right" }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex flex-col justify-end p-4 ${
        side === "left" ? "items-start" : "items-end"
      }`}
    >
      <span className="rounded-md bg-black/60 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wide text-white">
        {label}
      </span>
    </div>
  );
}

function SlideImage({ src, label, side }: { src: string; label: string; side: "left" | "right" }) {
  return (
    <div className="relative h-full w-full">
      <Image src={src} alt={label} fill sizes="448px" className="object-cover" />
      <SlideLabel label={label} side={side} />
    </div>
  );
}

export default function ServiciosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Servicios</h1>
        <p className="text-sm text-slate-400">Herramientas adicionales para potenciar tus publicaciones.</p>
      </div>

      <div className="flex max-w-md flex-col gap-3">
        <Link
          href="/panel/servicios/mejorar-con-ia"
          className="group flex items-center gap-2 font-display text-lg font-semibold text-white transition-colors hover:text-emerald-400"
        >
          <Sparkles size={20} className="text-emerald-400" />
          Mejorar con IA
        </Link>

        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
          <ReactCompareSlider
            style={{ height: 260 }}
            itemOne={<SlideImage src="/servicios/antes.png" label="Antes" side="left" />}
            itemTwo={<SlideImage src="/servicios/despues.png" label="Después" side="right" />}
          />
        </div>
      </div>
    </div>
  );
}
