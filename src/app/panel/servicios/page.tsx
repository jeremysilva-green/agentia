import Link from "next/link";
import { Home as HomeIcon, Sparkles } from "lucide-react";
import { ReactCompareSlider } from "react-compare-slider";

// Placeholder visual for the before/after slider — no real AI-enhanced
// property photo exists yet, so this is an honest gradient/label stand-in
// rather than a fabricated "before/after" image.
//
// Content is anchored toward each side's OUTER edge rather than centered —
// confirmed via a visual test that dead-center content collides with the
// slider's drag handle, which also sits at the center by default.
function PlaceholderSide({ label, className, side }: { label: string; className: string; side: "left" | "right" }) {
  return (
    <div
      className={`flex h-full w-full flex-col justify-center gap-2 ${className} ${
        side === "left" ? "items-start pl-4" : "items-end pr-4"
      }`}
    >
      <HomeIcon size={40} className="text-white/70" />
      <span className="font-display text-sm font-semibold uppercase tracking-wide text-white/80">{label}</span>
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
            itemOne={<PlaceholderSide label="Antes" className="bg-neutral-800" side="left" />}
            itemTwo={
              <PlaceholderSide label="Después" className="bg-gradient-to-br from-emerald-700 to-emerald-500" side="right" />
            }
          />
        </div>
      </div>
    </div>
  );
}
