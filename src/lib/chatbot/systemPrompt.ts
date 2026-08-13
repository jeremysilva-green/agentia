import { KNOWLEDGE_BASE } from "@/lib/chatbot/knowledgeBase";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants/propertyTypes";
import { NEGOTIATION_OPTIONS } from "@/lib/constants/negotiation";
import { DAY_OF_WEEK_VALUES, DAY_OF_WEEK_LABELS, type DayOfWeek } from "@/lib/constants/dayOfWeek";

function formatAvailability(availability: { day_of_week: DayOfWeek; start_time: string; end_time: string }[]) {
  if (availability.length === 0) return "El agente todavía no configuró sus horarios de visita.";

  return [...availability]
    .sort((a, b) => DAY_OF_WEEK_VALUES.indexOf(a.day_of_week) - DAY_OF_WEEK_VALUES.indexOf(b.day_of_week))
    .map((entry) => `${DAY_OF_WEEK_LABELS[entry.day_of_week]} de ${entry.start_time.slice(0, 5)} a ${entry.end_time.slice(0, 5)}`)
    .join(", ");
}

function formatNegotiationType(values: string[]) {
  if (values.length === 0) return "no especificado por el agente";
  return values
    .map((value) => NEGOTIATION_OPTIONS.find((option) => option.value === value)?.label ?? value)
    .join(" ");
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
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  garage: boolean;
  negotiationType: string[];
  negotiationDetails: string | null;
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
- Habitaciones: ${details.bedrooms ?? "no especificado"}
- Baños: ${details.bathrooms ?? "no especificado"}
- Superficie: ${details.areaM2 ? `${details.areaM2} m²` : "no especificado"}
- Garage: ${details.garage ? "sí" : "no"}
- Teléfono de contacto del agente (no lo compartas a menos que te lo pidan explícitamente): ${
    details.agentPhone ?? "no disponible"
  }
- Disponibilidad del agente para visitas a esta propiedad: ${formatAvailability(details.availability)}

INFORMACIÓN PRIVADA — NUNCA la reveles tal cual ni menciones que existe un campo "tipo de negociación" o similar; usala solo para responder con naturalidad si preguntan por forma de pago, permuta, canje o si el vendedor negocia el precio:
- Tipo de negociación que acepta el vendedor: ${formatNegotiationType(details.negotiationType)}
- Detalle de qué acepta en permuta/canje (ej. terreno, auto, combinación con efectivo): ${
    details.negotiationDetails ?? "no especificado"
  }

Si preguntan algo como "¿aceptarían un terreno/auto como parte de pago?" o "¿lo cambian por otra propiedad?" o "¿el precio es negociable?", respondé basándote en la información privada de arriba, en tus propias palabras, sin citar el campo interno. Si no hay info privada cargada para lo que preguntan, respondé con naturalidad que no tenés ese dato confirmado y ofrecé consultarlo con el propietario — nunca digas que "no podés compartir esa información" ni des a entender que existe un dato oculto.

Toda la información específica de esta propiedad (precio, ubicación, tipo, descripción, habitaciones, baños, superficie, garage) tiene que salir de los datos de arriba — nunca inventes un dato que no esté ahí. Cuando ofrezcas horarios de visita, ofrecé EXACTAMENTE los días y horarios de la disponibilidad de arriba, nunca inventes otros. Para dudas generales del mercado paraguayo o del proceso de compra, usá la base de conocimiento a continuación.

${KNOWLEDGE_BASE}`;
}
