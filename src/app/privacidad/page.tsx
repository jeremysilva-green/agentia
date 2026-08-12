import { Card } from "@/components/ui/Card";
import { InteractiveBackground } from "@/components/InteractiveBackground";

const sections = [
  {
    title: "1. Qué datos recopilamos",
    body: "Recopilamos los datos que nos proporcionás al crear una cuenta (nombre, correo electrónico, teléfono, ciudad), al publicar una propiedad (fotos, descripción, ubicación, precio), al contactar a un agente o afiliado (nombre y teléfono del comprador), y datos técnicos básicos de uso de la plataforma (vistas de propiedad, clics en enlaces de afiliado, identificadores anónimos de visitante).",
  },
  {
    title: "2. Para qué usamos tus datos",
    body: "Usamos tus datos para operar la plataforma: mostrar perfiles y propiedades, conectar compradores con agentes, calcular y confirmar comisiones de afiliados, enviarte notificaciones relacionadas con tu cuenta y mejorar el funcionamiento del sitio. No vendemos tus datos personales a terceros.",
  },
  {
    title: "3. Con quién compartimos información",
    body: "Compartimos información con el agente o afiliado correspondiente cuando es necesario para gestionar una consulta o venta (por ejemplo, el nombre y teléfono de un comprador se comparte con el agente de la propiedad consultada). Usamos proveedores de infraestructura (como Supabase para base de datos y almacenamiento, y Vercel para hosting) que procesan datos en nuestro nombre bajo sus propias políticas de seguridad.",
  },
  {
    title: "4. Ranking de afiliados",
    body: "El Ranking de Afiliados es público y muestra únicamente el nombre del afiliado y la cantidad de ventas cerradas en el mes. Nunca se muestran montos de comisión, datos de contacto ni información sobre compradores.",
  },
  {
    title: "5. Seguridad",
    body: "Tomamos medidas razonables para proteger tu información, incluyendo control de acceso basado en roles y conexiones cifradas. Ningún sistema es 100% seguro, por lo que te recomendamos usar una contraseña única para tu cuenta.",
  },
  {
    title: "6. Tus derechos",
    body: "Podés acceder, corregir o eliminar tu información de perfil desde tu panel en cualquier momento, o escribiéndonos a través de nuestros canales de contacto.",
  },
  {
    title: "7. Cambios a esta política",
    body: "Podemos actualizar esta política ocasionalmente para reflejar cambios en la plataforma. Publicaremos cualquier cambio importante en esta misma página.",
  },
];

export default function PrivacidadPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />

      <section className="relative border-b border-slate-200 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance font-display text-4xl font-semibold tracking-tight text-prussian sm:text-5xl">
            Política de Privacidad
          </h1>
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
