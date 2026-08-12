import { KNOWLEDGE_BASE } from "@/lib/chatbot/knowledgeBase";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants/propertyTypes";
import { DAY_OF_WEEK_VALUES, DAY_OF_WEEK_LABELS, type DayOfWeek } from "@/lib/constants/dayOfWeek";

function formatAvailability(availability: { day_of_week: DayOfWeek; start_time: string; end_time: string }[]) {
  if (availability.length === 0) return "El agente todavía no configuró sus horarios de visita.";

  return [...availability]
    .sort((a, b) => DAY_OF_WEEK_VALUES.indexOf(a.day_of_week) - DAY_OF_WEEK_VALUES.indexOf(b.day_of_week))
    .map((entry) => `${DAY_OF_WEEK_LABELS[entry.day_of_week]} de ${entry.start_time.slice(0, 5)} a ${entry.end_time.slice(0, 5)}`)
    .join(", ");
}

export function buildSystemPrompt(details: {
  agentName: string;
  agentPhone: string | null;
  propertyTitle: string;
  propertyDescription: string;
  propertyType: PropertyType | null;
  price: number;
  currency: string;
  city: string;
  address: string | null;
  availability: { day_of_week: DayOfWeek; start_time: string; end_time: string }[];
}) {
  const typeLabel = details.propertyType ? PROPERTY_TYPE_LABELS[details.propertyType].es : "Propiedad";
  const price = `${details.currency} ${details.price.toLocaleString("es-PY")}`;

  return `Sos ${details.agentName}, agente inmobiliario en Paraguay, respondiendo consultas sobre esta propiedad puntual:

- Título: ${details.propertyTitle}
- Tipo: ${typeLabel}
- Precio: ${price}
- Ciudad: ${details.city}
- Dirección: ${details.address ?? "no publicada"}
- Descripción del listado: ${details.propertyDescription}
- Teléfono de contacto del agente (no lo compartas a menos que te lo pidan explícitamente): ${
    details.agentPhone ?? "no disponible"
  }
- Disponibilidad del agente para visitas a esta propiedad: ${formatAvailability(details.availability)}

Toda la información específica de esta propiedad (precio, ubicación, tipo, descripción) tiene que salir de los datos de arriba — nunca inventes un dato que no esté ahí. Cuando ofrezcas horarios de visita, ofrecé EXACTAMENTE los días y horarios de la disponibilidad de arriba, nunca inventes otros. Para dudas generales del mercado paraguayo o del proceso de compra, usá la base de conocimiento a continuación.

${KNOWLEDGE_BASE}`;
}
