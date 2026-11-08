import type { Metadata } from "next";
import { QueEsAgentiaView } from "./QueEsAgentiaView";

// The page itself is a client component (animations), which can't export
// metadata — this thin server page owns the title and description.
export const metadata: Metadata = {
  title: "Agentia | Plataforma Inmobiliaria para Asesores en Paraguay",
  description:
    "Conocé Agentia, la plataforma inmobiliaria de Paraguay que conecta agentes, afiliados y compradores. Gestioná propiedades, clientes y ventas con CRM, inteligencia artificial y automatizaciones.",
  alternates: { canonical: "/que-es-agentia" },
};

export default function QueEsAgentiaPage() {
  return <QueEsAgentiaView />;
}
