import { Card } from "@/components/ui/Card";
import { InteractiveBackground } from "@/components/InteractiveBackground";

const aboutParagraphs = [
  "AGENTIA es una plataforma inmobiliaria all-in-one que conecta a agentes inmobiliarios, afiliados y compradores en un mismo ecosistema digital, con el objetivo de hacer que las propiedades se vendan más rápido y de manera más eficiente.",
  "A través de la plataforma, los agentes inmobiliarios pueden crear su perfil profesional, construir su portafolio de propiedades y acceder a herramientas diseñadas para optimizar y automatizar su proceso de ventas. Los agentes cuentan con un sistema integrado de CRM, herramientas de marketing digital, automatizaciones y un chatbot con inteligencia artificial que les ayuda a gestionar clientes potenciales, mejorar el seguimiento comercial y optimizar sus procesos.",
  "La plataforma cuenta con dos modalidades de participación: Agente y Afiliado.",
  "El Agente se suscribe a la plataforma mediante un plan mensual y puede publicar y gestionar sus propiedades disponibles para la venta. Cuando una propiedad se vende, el agente recibe una comisión del 5,5% de la operación.",
  "El Afiliado, por otro lado, puede registrarse de forma gratuita y ayudar a los agentes a vender sus propiedades. Puede seleccionar cualquier propiedad disponible en la plataforma, generar un link único de afiliado y compartirlo a través de sus redes sociales, WhatsApp, contactos o cualquier otro canal de divulgación. Cuando una venta se concreta a través de su enlace, el afiliado recibe una comisión del 1% del valor de la operación.",
  "Finalmente, está el Comprador, quien puede descubrir propiedades, conocer sus características y ponerse en contacto con el agente encargado de la propiedad a través de un proceso de comunicación centralizado.",
  "El principal objetivo de AGENTIA es crear un nuevo modelo de comercialización inmobiliaria en Paraguay, donde una propiedad no depende únicamente de la capacidad de difusión de un agente, sino que puede ser promovida por una red de afiliados que ayudan a aumentar significativamente su alcance y sus oportunidades de venta.",
  "De esta manera, la plataforma crea un ecosistema en el que todos pueden beneficiarse: el agente tiene más alcance y oportunidades de vender, el afiliado puede generar ingresos recomendando propiedades y el comprador obtiene acceso a una oferta inmobiliaria más amplia y a un proceso de atención más organizado.",
  "Además, la plataforma busca generar un vínculo de confianza y transparencia entre el comprador, el agente y el afiliado. La comunicación y el proceso comercial se mantienen centralizados y registrados, evitando que la información se pierda durante el proceso de venta. Cada interacción, contacto y oportunidad comercial puede quedar registrada en la base de datos y CRM del agente, permitiéndole mantener el control de sus clientes y hacer un seguimiento adecuado de cada operación.",
  "AGENTIA busca convertirse en una nueva infraestructura digital para el sector inmobiliario paraguayo, combinando ventas colaborativas, marketing digital, automatización, CRM e inteligencia artificial en una sola plataforma.",
  "En esencia, es un ecosistema diseñado para vender propiedades más rápido, ampliar el alcance de cada publicación y conectar de manera más eficiente a agentes, afiliados y compradores.",
];

const roles = [
  {
    question: "EL AGENTE",
    answer:
      "Es el profesional que publica y comercializa propiedades dentro de la plataforma. Crea su perfil, administra su portafolio de propiedades y utiliza las herramientas de CRM, marketing, automatización e inteligencia artificial para gestionar sus clientes y acelerar sus ventas. El agente recibe una comisión del 5,5% por cada propiedad vendida.",
  },
  {
    question: "EL AFILIADO",
    answer:
      "Es una persona que se registra gratuitamente en la plataforma y ayuda a promocionar propiedades publicadas por los agentes. Puede generar un enlace único para cada propiedad y compartirlo con su red de contactos y canales digitales. Si una venta se concreta gracias a su enlace, recibe una comisión del 1% del valor de la operación.",
  },
  {
    question: "EL COMPRADOR",
    answer:
      "Es la persona interesada en adquirir una propiedad. Puede descubrir y consultar propiedades disponibles, acceder a la información del inmueble y establecer contacto con el agente responsable de la venta. Su interacción queda integrada al proceso comercial para facilitar el seguimiento y mantener una comunicación clara y organizada.",
  },
];

export default function QueEsAgentiaPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />

      <section className="relative border-b border-slate-200 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance font-display text-4xl font-semibold tracking-tight text-prussian sm:text-5xl">
            ¿Qué es Agentia?
          </h1>
        </div>
      </section>

      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Card className="flex flex-col gap-5 border-emerald-200! bg-emerald-50! p-6 sm:p-8">
          {aboutParagraphs.map((paragraph, i) => (
            <p key={i} className="font-display-light leading-relaxed text-slate-700">
              {paragraph}
            </p>
          ))}
        </Card>
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-4 px-4 pb-16 sm:grid-cols-3 sm:px-6">
        {roles.map((role) => (
          <Card key={role.question} className="flex flex-col gap-2 border-emerald-200! bg-emerald-50! p-6">
            <h2 className="font-display text-lg font-semibold text-prussian">{role.question}</h2>
            <p className="font-display-light text-sm leading-relaxed text-slate-600">{role.answer}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
