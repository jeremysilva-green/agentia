import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

// Compact promo for "Mejorar con IA", shown above the search bar so the
// feature isn't buried inside the agent panel. The image is a diagonal
// before/after split of the same sample photo the panel's slider uses.
export function AiEnhanceBanner({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-4 overflow-hidden rounded-[22px] border border-[#13c47f66] bg-[linear-gradient(110deg,#0a8f5c40,#151515_55%)] p-3 pr-4 shadow-[0_18px_50px_-24px_var(--em-glow)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-[var(--em-2)] hover:shadow-[0_24px_60px_-22px_var(--em-glow)] sm:gap-5 sm:p-3.5 sm:pr-5"
    >
      <div className="relative h-[84px] w-[132px] shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:h-[96px] sm:w-[168px]">
        <Image src="/servicios/despues.png" alt="" fill sizes="168px" className="object-cover" />
        <div className="absolute inset-0" style={{ clipPath: "polygon(0 0, 56% 0, 44% 100%, 0 100%)" }}>
          <Image src="/servicios/antes.png" alt="" fill sizes="168px" className="object-cover" />
        </div>
        <span
          aria-hidden
          className="absolute inset-y-0 left-[50%] w-[2px] -translate-x-1/2 -skew-x-[12deg] bg-white/80 shadow-[0_0_10px_#fff]"
        />
        <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
          Antes
        </span>
        <span className="absolute right-1.5 bottom-1.5 rounded-md bg-[var(--em)] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
          Después
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#13c47f55] bg-[#13c47f1a] px-2.5 py-0.5 text-[10.5px] font-bold tracking-wide text-[var(--em-2)] uppercase">
          <Sparkles size={11} />
          Nuevo · IA
        </span>
        <p className="mt-1.5 font-display text-[17px] leading-tight font-semibold text-white sm:text-xl">
          Mejorá tus fotos con IA
        </p>
        <p className="mt-0.5 hidden text-[13.5px] text-[#b9c4be] sm:block">
          Subí una foto de tu propiedad y la dejamos lista para publicar en segundos.
        </p>
      </div>

      <span className="hidden shrink-0 items-center gap-2 rounded-[13px] bg-[var(--em)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_var(--em-glow)] transition-colors group-hover:bg-[var(--em-2)] sm:inline-flex">
        Probar ahora
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </span>
      <ArrowRight size={20} className="shrink-0 text-[var(--em-2)] sm:hidden" />
    </Link>
  );
}
