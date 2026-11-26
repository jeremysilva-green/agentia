import { Card } from "@/components/ui/Card";
import { InteractiveBackground } from "@/components/InteractiveBackground";

const sections = [
  {
    title: "1. Aceptación de los términos",
    body: "Al acceder o usar AGENTIA aceptás estos Términos de Servicio. Si no estás de acuerdo, no debés usar la plataforma. Los Agentes y Afiliados aceptan además términos adicionales específicos de su rol al momento de registrarse.",
  },
  {
    title: "2. Qué es AGENTIA",
    body: "AGENTIA es una plataforma tecnológica que conecta a Agentes inmobiliarios, Afiliados y Compradores. AGENTIA facilita el descubrimiento y la promoción de propiedades, pero no es parte de la relación comercial ni de la transacción de compraventa entre las partes.",
  },
  {
    title: "3. Cuentas de usuario",
    body: "Sos responsable de mantener la confidencialidad de tu cuenta y contraseña, y de toda actividad que ocurra bajo tu cuenta. Debés proporcionar información veraz al registrarte y mantenerla actualizada.",
  },
  {
    title: "4. Publicación de propiedades",
    body: "Los Agentes son responsables de la veracidad de la información y las fotos que publican sobre sus propiedades. AGENTIA se reserva el derecho de remover cualquier publicación que considere engañosa, inexacta o contraria a estos términos.",
  },
  {
    title: "5. Planes y pagos",
    body: "El plan Básico es gratuito y permite hasta 6 propiedades activas. Los planes pagos (Pro, Fundador y MLS) se cobran por mes, por adelantado, en guaraníes, al precio publicado en la página de Planes al momento de contratarlos. Los pagos se procesan a través de dLocal Go: la tarjeta se ingresa en la página de pago de dLocal Go y AGENTIA no recibe ni guarda sus datos. Al contratar un plan pago autorizás el cobro automático mensual en esa tarjeta hasta que canceles. Si tu plan incluye un período de prueba gratis, el primer cobro se realiza al terminar la prueba. Por cada pago recibís una factura electrónica por correo. Si cambiamos el precio de un plan, te avisaremos antes de que el nuevo precio se aplique a tu próximo cobro.",
  },
  {
    title: "6. Pagos rechazados",
    body: "Si un cobro mensual es rechazado, tu plan queda vencido: tu perfil y tus propiedades dejan de mostrarse públicamente y, en el Plan MLS, tu membresía del MLS pasa a estado inactivo. No se elimina nada; todo vuelve a estar visible cuando el pago se confirma.",
  },
  {
    title: "7. Cancelación",
    body: "Podés cancelar tu suscripción en cualquier momento desde Panel → Suscripción. La cancelación tiene efecto inmediato: se detienen los cobros automáticos y tu cuenta pasa al plan Básico, por lo que solo tus 6 propiedades activas más recientes quedan visibles públicamente. El resto se guarda y podés volver a publicarlas si te suscribís de nuevo. No se reembolsan los días restantes del mes ya pagado. Para volver a suscribirte vas a tener que cargar tu tarjeta de nuevo.",
  },
  {
    title: "8. Comisiones",
    body: "Las comisiones de Agentes y Afiliados se calculan según los porcentajes vigentes en la plataforma al momento del cierre de una venta, y se confirman a través del flujo de cierre de trato dentro del panel del Agente.",
  },
  {
    title: "9. Uso aceptable",
    body: "No está permitido usar la plataforma para fines fraudulentos, publicar contenido falso o engañoso, ni intentar vulnerar la seguridad del sitio.",
  },
  {
    title: "10. Limitación de responsabilidad",
    body: "AGENTIA no garantiza la exactitud de las publicaciones realizadas por terceros ni es responsable por acuerdos comerciales entre Agentes, Afiliados y Compradores. La plataforma se ofrece \"tal cual\", sin garantías de ningún tipo.",
  },
  {
    title: "11. Cambios a estos términos",
    body: "Podemos actualizar estos Términos de Servicio ocasionalmente. El uso continuo de la plataforma después de un cambio implica la aceptación de los nuevos términos.",
  },
];

export default function TerminosPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />

      <section className="relative border-b border-slate-200 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance font-display text-4xl font-semibold tracking-tight text-prussian sm:text-5xl">
            Términos de Servicio
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            AGENTIA es operada por <span className="font-medium text-slate-700">AGENTIA E.A.S. UNIPERSONAL</span> — RUC
            80177563-9
          </p>
        </div>
      </section>

      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Card className="flex flex-col gap-5 p-6 sm:p-8">
          {sections.map((section) => (
            <div key={section.title} className="flex flex-col gap-1.5">
              <h2 className="font-display text-base font-semibold text-prussian">{section.title}</h2>
              <p className="font-display-light leading-relaxed text-slate-700">{section.body}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
