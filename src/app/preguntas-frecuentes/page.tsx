import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { AFFILIATE_SHARE_DEFAULT_PCT } from "@/lib/constants/commission";
import { BASICO_FREE_ENHANCE_TRIES, BASICO_PROPERTY_LIMIT, FUNDADOR_SEAT_LIMIT, PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "FAQ | Agentia",
  description:
    "Respuestas sobre cómo funciona Agentia para agentes inmobiliarios y afiliados en Paraguay: precios, publicar propiedades gratis y el sistema de afiliados.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

const gs = (amount: number) => `Gs. ${amount.toLocaleString("es-PY")}`;

// Prices and limits come from lib/plans.ts, so this page can't drift from the
// plans page.
const faqs = [
  {
    question: "¿Cómo funciona Agentia para agentes inmobiliarios?",
    answer:
      "Te registrás como agente, cargás tus propiedades y Agentia te da un perfil profesional con tu marca y una página propia para cada propiedad, lista para compartir. Además incluye un CRM donde queda registrado cada contacto, un chatbot con inteligencia artificial que atiende y califica a los interesados, contratos digitales, agendamiento de visitas y herramientas de marketing con IA (mejora de fotos, flyers y videos para redes). Una red de afiliados también promociona tus propiedades con su link único, y vos definís tu comisión en cada una.",
  },
  {
    question: "¿Cuánto cuesta utilizar Agentia?",
    answer: `Registrarte es gratis. El plan Básico no tiene costo. Los planes pagos son Pro (${gs(PLANS.pro.price)} por mes), Fundador (${gs(PLANS.fundador.price)} por mes, con precio exclusivo para los primeros ${FUNDADOR_SEAT_LIMIT} agentes mientras mantengas activa tu suscripción) y Plan MLS (${gs(PLANS.mls.price)} por mes, que suma la red de cooperación MLS entre agentes de distintas agencias). Para los afiliados y los compradores, usar Agentia no tiene costo.`,
  },
  {
    question: "¿Cómo funciona el sistema de afiliados?",
    answer: `Cualquier persona puede registrarse como afiliado sin costo. El afiliado elige una propiedad publicada, genera su link único y lo comparte por WhatsApp, Instagram, Facebook o con sus contactos. Si un cliente llega por ese link y la venta se concreta, el afiliado cobra una parte de la comisión del agente (desde el ${AFFILIATE_SHARE_DEFAULT_PCT}%, según lo que el agente defina para esa propiedad). La comisión solo se paga cuando la propiedad se vende, y cada contacto y oportunidad queda registrado en el CRM del agente.`,
  },
  {
    question: "¿Puedo publicar propiedades gratis?",
    answer: `Sí. Con el plan Básico podés tener hasta ${BASICO_PROPERTY_LIMIT} propiedades activas sin pagar y sin cargar una tarjeta, e incluye ${BASICO_FREE_ENHANCE_TRIES} mejoras de fotos con inteligencia artificial gratis. Si necesitás publicar más, los planes Pro, Fundador y MLS permiten propiedades ilimitadas.`,
  },
  {
    question: "¿Agentia funciona en Paraguay?",
    answer:
      "Sí. Agentia está pensada para el mercado inmobiliario paraguayo: las propiedades se publican por ciudad y zona de Paraguay, con precios en guaraníes o en dólares, la plataforma está en español y los planes se cobran en guaraníes.",
  },
];

export default function PreguntasFrecuentesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />

      <section className="relative border-b border-slate-200 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance font-display text-4xl font-semibold tracking-tight text-prussian sm:text-5xl">
            FAQ
          </h1>
          <p className="font-display-light mt-3 text-slate-600">
            Todo lo que querés saber sobre Agentia, la plataforma inmobiliaria de Paraguay.
          </p>
        </div>
      </section>

      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Card className="flex flex-col gap-6 p-6 sm:p-8">
          {faqs.map((faq) => (
            <div key={faq.question} className="flex flex-col gap-1.5">
              <h2 className="font-display text-base font-semibold text-prussian">{faq.question}</h2>
              <p className="font-display-light leading-relaxed text-slate-700">{faq.answer}</p>
            </div>
          ))}
          <p className="font-display-light border-t border-slate-200 pt-5 text-sm text-slate-600">
            ¿Querés ver todo en detalle? Conocé{" "}
            <Link href="/que-es-agentia" className="font-medium text-emerald-700 hover:underline">
              qué es Agentia
            </Link>
            , los{" "}
            <Link href="/planes" className="font-medium text-emerald-700 hover:underline">
              planes
            </Link>{" "}
            o{" "}
            <Link href="/registro/agente" className="font-medium text-emerald-700 hover:underline">
              registrate gratis como agente
            </Link>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}
