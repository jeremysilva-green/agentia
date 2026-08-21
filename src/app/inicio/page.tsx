import Link from "next/link";
import {
  Home,
  MessageCircle,
  Users,
  CalendarClock,
  Inbox,
  LayoutDashboard,
  FileSignature,
  Link2,
  TrendingUp,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  UserPlus,
  Building2,
  Sparkles,
} from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { PLANS, PLAN_ORDER, FUNDADOR_SEAT_LIMIT } from "@/lib/plans";

const steps = [
  {
    number: "1",
    title: "Creá tu cuenta",
    description: "Registrate gratis como agente, sin tarjeta y sin compromiso.",
  },
  {
    number: "2",
    title: "Armá tu portafolio",
    description: "Publicá tus propiedades con tu propia marca, en minutos.",
  },
  {
    number: "3",
    title: "Recibí leads y vendé",
    description: "El asistente de IA y tu red de afiliados te traen compradores.",
  },
];

const agentFeatures = [
  { icon: Home, title: "Portafolio propio con tu marca", description: "Tu página pública, tus propiedades, tu contacto — sin compartir vidriera." },
  { icon: MessageCircle, title: "Asistente de IA 24/7", description: "Responde consultas de compradores en tu nombre, a toda hora." },
  { icon: Users, title: "Captura automática de leads", description: "Cada contacto compartido en el chat aparece directo en tu panel." },
  { icon: CalendarClock, title: "Agendamiento automático de visitas", description: "Según tu disponibilidad real, sin ida y vuelta de mensajes." },
  { icon: Inbox, title: "CRM centralizado", description: "Leads, solicitudes y conversaciones, todo organizado en un solo panel." },
  { icon: LayoutDashboard, title: "Vista Global con reportes PDF", description: "Todas tus métricas del mes y reportes descargables, con un clic." },
  { icon: FileSignature, title: "Acuerdo Privado con firma digital", description: "El propietario firma la autorización de venta desde el celular." },
  { icon: Link2, title: "Programa de afiliados propio", description: "Otros promocionan tus propiedades; pagás comisión solo si se vende." },
];

const affiliateFeatures = [
  { icon: Link2, title: "Ganá sin ser inmobiliaria", description: "Generá un link único por propiedad en segundos." },
  { icon: TrendingUp, title: "Comisión del 1%", description: "Por cada venta cerrada que ayudaste a generar." },
  { icon: LayoutDashboard, title: "Estadísticas claras", description: "Clics, leads, ventas y comisiones, en un panel simple." },
  { icon: ShieldCheck, title: "Cero riesgo", description: "Sin stock, sin oficina, sin costos fijos." },
];

const painSolutions = [
  {
    pain: "Tus propiedades se pierden entre las de la competencia en grupos de Facebook.",
    solution: "Portafolio propio con tu marca — tu vidriera, no la de todos.",
  },
  {
    pain: "Perdés compradores porque no podés responder a toda hora.",
    solution: "Un asistente de IA que atiende y agenda visitas por vos, 24/7.",
  },
  {
    pain: "Tus leads están dispersos entre WhatsApp y la memoria.",
    solution: "Un CRM que organiza cada lead, solicitud y conversación en un panel.",
  },
  {
    pain: "No tenés forma de saber si tu negocio realmente está creciendo.",
    solution: "Vista Global: todas tus métricas del mes y reportes en PDF.",
  },
  {
    pain: "Conseguir referidos es caro y complicado.",
    solution: "Programa de afiliados: pagás comisión solo si se concreta la venta.",
  },
];

export default function InicioPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />

      {/* Hero */}
      <section className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28 sm:pb-20">
        <span
          className="animate-fade-in-up inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-black/30 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-md"
          style={{ animationDelay: "0ms" }}
        >
          <Sparkles size={13} />
          La plataforma inmobiliaria todo-en-uno de Paraguay
        </span>

        <h1
          className="animate-fade-in-up text-balance font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl"
          style={{ animationDelay: "100ms" }}
        >
          Vendé más propiedades, con menos trabajo
        </h1>

        <p
          className="animate-fade-in-up max-w-2xl text-balance text-base leading-relaxed text-white/70 sm:text-lg"
          style={{ animationDelay: "200ms" }}
        >
          Tu portafolio, tu CRM, tu asistente de IA y tu propia red de afiliados vendiendo por vos — todo en un solo lugar.
          Empezá gratis, sin tarjeta.
        </p>

        <div
          className="animate-fade-in-up flex flex-col items-center gap-3 pt-2 sm:flex-row"
          style={{ animationDelay: "300ms" }}
        >
          <Link
            href="/registro"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-base font-medium text-white transition-colors hover:bg-emerald-600"
          >
            Creá tu cuenta gratis
            <ArrowRight size={18} />
          </Link>
          <Link
            href="#planes"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-emerald-400 bg-black px-6 text-base font-medium text-emerald-400 transition-colors hover:bg-emerald-400/10"
          >
            Ver planes
          </Link>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="relative mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="animate-fade-in-up flex flex-col gap-2 rounded-2xl border border-emerald-500/40 bg-black/30 p-5 backdrop-blur-md transition-transform duration-300 ease-out hover:scale-[1.03]"
              style={{ animationDelay: `${400 + i * 100}ms` }}
            >
              <span className="font-display text-3xl font-semibold text-emerald-400">{step.number}</span>
              <h3 className="font-display text-base font-semibold text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Para agentes */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <Building2 size={20} className="text-emerald-400" />
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">Para Agentes</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agentFeatures.map((feature, i) => (
            <div
              key={feature.title}
              className="animate-fade-in-up flex flex-col gap-2.5 rounded-2xl border border-emerald-500/40 bg-black/30 p-5 backdrop-blur-md transition-transform duration-300 ease-out hover:scale-[1.03]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <feature.icon size={20} className="text-emerald-400" />
              <h3 className="font-display text-sm font-semibold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Para afiliados */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <UserPlus size={20} className="text-emerald-400" />
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">Para Afiliados</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {affiliateFeatures.map((feature, i) => (
            <div
              key={feature.title}
              className="animate-fade-in-up flex flex-col gap-2.5 rounded-2xl border border-emerald-500/40 bg-black/30 p-5 backdrop-blur-md transition-transform duration-300 ease-out hover:scale-[1.03]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <feature.icon size={20} className="text-emerald-400" />
              <h3 className="font-display text-sm font-semibold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dolor -> Solución */}
      <section className="relative mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <h2 className="mb-6 text-center font-display text-2xl font-semibold text-white sm:text-3xl">
          Los problemas de siempre, resueltos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {painSolutions.map((item, i) => (
            <div
              key={item.pain}
              className="animate-fade-in-up flex flex-col gap-3 rounded-2xl border border-emerald-500/40 bg-black/30 p-5 backdrop-blur-md transition-transform duration-300 ease-out hover:scale-[1.02]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-2.5">
                <X size={16} className="mt-0.5 shrink-0 text-rose-400" />
                <p className="text-sm leading-relaxed text-white/60">{item.pain}</p>
              </div>
              <div className="flex items-start gap-2.5">
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                <p className="text-sm font-medium leading-relaxed text-white">{item.solution}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6">
        <h2 className="mb-6 text-center font-display text-2xl font-semibold text-white sm:text-3xl">Planes</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            return (
              <div
                key={plan.id}
                className={`flex flex-col gap-3 rounded-2xl border bg-black/30 p-5 backdrop-blur-md transition-transform duration-300 ease-out hover:scale-[1.03] ${
                  plan.highlighted ? "border-emerald-400 ring-1 ring-emerald-400" : "border-emerald-500/40"
                }`}
              >
                <div>
                  <p className="text-[10px] font-medium tracking-widest text-emerald-300/80">{plan.eyebrow}</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="mt-0.5 text-xs text-white/60">{plan.tagline}</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {plan.price === 0 ? "Gratis" : `Gs. ${plan.price.toLocaleString("es-PY")}`}
                  {plan.price > 0 && <span className="ml-1 text-sm font-normal text-white/50">/mes</span>}
                </p>
                {planId === "fundador" && (
                  <p className="text-xs font-medium text-amber-400">Cupos limitados a los primeros {FUNDADOR_SEAT_LIMIT} agentes</p>
                )}
                <ul className="flex flex-1 flex-col gap-1.5 text-xs">
                  {plan.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                      <span className="text-white/70">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href="/registro"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-base font-medium text-white transition-colors hover:bg-emerald-600"
          >
            Empezá gratis hoy
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-emerald-400 bg-black/40 p-8 text-center backdrop-blur-md sm:p-12">
          <h2 className="text-balance font-display text-2xl font-semibold text-white sm:text-3xl">
            Sumate como Fundador y asegurá tu lugar
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            Precio exclusivo para los primeros {FUNDADOR_SEAT_LIMIT} agentes, con todas las herramientas del plan Pro.
            Creá tu cuenta en 2 minutos y empezá a vender más, con menos trabajo.
          </p>
          <Link
            href="/registro"
            className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-base font-medium text-white transition-colors hover:bg-emerald-600"
          >
            Creá tu cuenta gratis
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
