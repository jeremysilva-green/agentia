import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/service";
import { buildSystemPrompt } from "@/lib/chatbot/systemPrompt";
import { upsertLeadFromChatClick } from "@/lib/leads/referralProtection";
import { isPropertyType } from "@/lib/constants/propertyTypes";
import { DAY_OF_WEEK_VALUES, isDayOfWeek } from "@/lib/constants/dayOfWeek";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOOL_ROUNDS = 3;
const CONVERSATION_STALE_MS = 24 * 60 * 60 * 1000;

const SAVE_LEAD_TOOL: Anthropic.Tool = {
  name: "save_lead_contact",
  description:
    "Guarda el nombre y teléfono del interesado apenas los compartan en la conversación, para que el agente reciba el lead. Llamala una sola vez por conversación, en cuanto tengas ambos datos.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nombre del interesado" },
      phone: { type: "string", description: "Teléfono del interesado" },
    },
    required: ["name", "phone"],
  },
};

const BOOK_VISIT_TOOL: Anthropic.Tool = {
  name: "book_visit",
  description:
    "Registra una visita agendada cuando el interesado confirma un día y horario. El horario elegido tiene que caer DENTRO de la ventana de disponibilidad del agente para ese día (no hace falta que coincida exactamente con toda la ventana — por ejemplo, si el agente está disponible de 08:00 a 14:00, un horario de 09:00 a 11:00 es válido). Necesita nombre y teléfono del interesado. NUNCA inventes ni asumas un end_time (por ejemplo, una hora de duración por defecto) — si el interesado solo dio la hora de inicio, preguntale hasta qué hora le queda bien ANTES de llamar esta herramienta. Llamala una sola vez que tengas día, hora de inicio Y hora de fin confirmadas explícitamente por el interesado, sin insistir en que el horario coincida exactamente con la ventana completa.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nombre del interesado" },
      phone: { type: "string", description: "Teléfono del interesado" },
      day_of_week: {
        type: "string",
        enum: [...DAY_OF_WEEK_VALUES],
        description: "Día elegido, en minúsculas sin tildes: lunes, martes, miercoles, jueves, viernes, sabado o domingo",
      },
      start_time: { type: "string", description: "Hora de inicio del horario elegido, formato HH:MM (24hs) — dicha explícitamente por el interesado, nunca asumida" },
      end_time: { type: "string", description: "Hora de fin del horario elegido, formato HH:MM (24hs) — dicha explícitamente por el interesado, nunca asumida ni una duración por defecto" },
    },
    required: ["name", "phone", "day_of_week", "start_time", "end_time"],
  },
};

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : null;
  const visitorId = typeof body?.visitorId === "string" ? body.visitorId : null;
  const userMessage = typeof body?.message === "string" ? body.message.trim() : "";
  const ref = typeof body?.ref === "string" ? body.ref : null;

  if (!propertyId || !visitorId || !userMessage) {
    return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: property } = await service
    .from("properties")
    .select(
      "id, title, description, price, price_includes_iva, currency, city, address, property_type, bedrooms, bathrooms, area_m2, garage, negotiation_type, negotiation_details, agent_id, agent_profiles(profiles(full_name, username, phone))"
    )
    .eq("id", propertyId)
    .eq("published", true)
    .single();

  if (!property) return NextResponse.json({ error: "Propiedad no encontrada." }, { status: 404 });

  type PropertyDetail = typeof property & {
    agent_profiles: { profiles: { full_name: string | null; username: string; phone: string | null } | null } | null;
  };
  const detail = property as unknown as PropertyDetail;
  const agentProfile = detail.agent_profiles?.profiles;
  const agentName = agentProfile?.full_name || agentProfile?.username || "el agente";
  const agentPhone = agentProfile?.phone ?? null;

  const { data: conversation } = await service
    .from("chat_conversations")
    .select("id, messages, updated_at")
    .eq("property_id", propertyId)
    .eq("visitor_id", visitorId)
    .maybeSingle();

  const { data: availabilityRows } = await service
    .from("agent_availability")
    .select("day_of_week, start_time, end_time")
    .eq("agent_id", detail.agent_id);

  const availability = (availabilityRows ?? []).filter((row) => isDayOfWeek(row.day_of_week));

  // A returning visitor picking the conversation back up after a long gap
  // starts fresh instead of dragging the whole old thread (and its token
  // cost) into every new message forever — same row gets reused (keeps
  // buyer_name/phone/lead_id), just the message history resets.
  const isStale =
    conversation != null && Date.now() - new Date(conversation.updated_at).getTime() > CONVERSATION_STALE_MS;
  const history = (!isStale && (conversation?.messages as unknown as MessageParam[] | null)) || [];
  const messages: MessageParam[] = [...history, { role: "user", content: userMessage }];

  const system = buildSystemPrompt({
    agentName,
    agentPhone,
    propertyTitle: detail.title,
    propertyDescription: detail.description,
    propertyType: detail.property_type && isPropertyType(detail.property_type) ? detail.property_type : null,
    price: detail.price,
    priceIncludesIva: detail.price_includes_iva,
    currency: detail.currency,
    availability,
    city: detail.city,
    address: detail.address,
    bedrooms: detail.bedrooms,
    bathrooms: detail.bathrooms,
    areaM2: detail.area_m2,
    garage: detail.garage,
    negotiationType: detail.negotiation_type,
    negotiationDetails: detail.negotiation_details,
  });

  const client = new Anthropic();
  let leadId: string | null = null;

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        thinking: { type: "disabled" },
        system,
        tools: [SAVE_LEAD_TOOL, BOOK_VISIT_TOOL],
        messages,
      });

      // Confirms prompt caching is actually hitting: cache_read_input_tokens
      // should be ~the size of KNOWLEDGE_BASE on every call after the first
      // one for a given 5-minute cache window; cache_creation_input_tokens
      // is only nonzero the first time (or after the cache expires).
      console.log("[chat] token usage", {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cache_read_input_tokens: response.usage.cache_read_input_tokens ?? 0,
        cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? 0,
      });

      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason !== "tool_use") {
        const replyText = extractText(response.content) || "Te escribo por WhatsApp y te cuento.";

        await service
          .from("chat_conversations")
          .upsert(
            {
              id: conversation?.id,
              property_id: propertyId,
              agent_id: detail.agent_id,
              visitor_id: visitorId,
              messages: messages as unknown as never,
              lead_id: leadId ?? undefined,
            },
            { onConflict: "property_id,visitor_id" }
          )
          .select("id")
          .single();

        generateSummary(propertyId, visitorId, messages).catch(() => {});

        return NextResponse.json({ reply: replyText });
      }

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        if (toolUse.name === "save_lead_contact") {
          const input = toolUse.input as { name?: string; phone?: string };
          if (input.name && input.phone) {
            const result = await upsertLeadFromChatClick({
              propertyId,
              buyerName: input.name,
              buyerPhone: input.phone,
              ref,
            });
            if ("leadId" in result) {
              leadId = result.leadId;
              await service
                .from("chat_conversations")
                .upsert(
                  {
                    id: conversation?.id,
                    property_id: propertyId,
                    agent_id: detail.agent_id,
                    visitor_id: visitorId,
                    buyer_name: input.name,
                    buyer_phone: input.phone,
                    lead_id: leadId,
                    messages: messages as unknown as never,
                  },
                  { onConflict: "property_id,visitor_id" }
                );
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: "Listo, guardé tus datos. El agente va a poder contactarte.",
              });
            } else {
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: "No se pudo guardar el contacto, pero seguí la conversación con normalidad.",
                is_error: true,
              });
            }
          } else {
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: "Faltan el nombre o el teléfono.",
              is_error: true,
            });
          }
        } else if (toolUse.name === "book_visit") {
          const input = toolUse.input as {
            name?: string;
            phone?: string;
            day_of_week?: string;
            start_time?: string;
            end_time?: string;
          };

          // The visitor's requested start/end just needs to fall WITHIN one
          // of the agent's availability windows for that day — it doesn't
          // need to exactly match the whole window (e.g. "9-11" inside an
          // "8-14" window is a perfectly valid booking, not a mismatch).
          const slotMatch =
            input.day_of_week &&
            input.start_time &&
            input.end_time &&
            input.start_time < input.end_time &&
            availability.find(
              (slot) =>
                slot.day_of_week === input.day_of_week &&
                input.start_time! >= slot.start_time.slice(0, 5) &&
                input.end_time! <= slot.end_time.slice(0, 5)
            );

          if (!input.name || !input.phone) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: "Faltan el nombre o el teléfono.",
              is_error: true,
            });
          } else if (!slotMatch) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: "Ese horario no cae dentro de tu disponibilidad para ese día. Ofrecé un horario que esté dentro de tu ventana disponible.",
              is_error: true,
            });
          } else {
            const result = await upsertLeadFromChatClick({
              propertyId,
              buyerName: input.name,
              buyerPhone: input.phone,
              ref,
            });

            if ("leadId" in result) {
              leadId = result.leadId;
              await service
                .from("chat_conversations")
                .upsert(
                  {
                    id: conversation?.id,
                    property_id: propertyId,
                    agent_id: detail.agent_id,
                    visitor_id: visitorId,
                    buyer_name: input.name,
                    buyer_phone: input.phone,
                    lead_id: leadId,
                    messages: messages as unknown as never,
                  },
                  { onConflict: "property_id,visitor_id" }
                );

              const { error: agendamientoError } = await service.from("agendamientos").insert({
                agent_id: detail.agent_id,
                property_id: propertyId,
                chat_conversation_id: conversation?.id ?? null,
                lead_id: leadId,
                client_name: input.name,
                client_phone: input.phone,
                day_of_week: slotMatch.day_of_week,
                start_time: input.start_time!,
                end_time: input.end_time!,
              });

              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: agendamientoError
                  ? "No se pudo registrar la visita, pero seguí la conversación con normalidad."
                  : "Listo, quedó agendada la visita. El agente va a coordinar los detalles por WhatsApp.",
                is_error: Boolean(agendamientoError),
              });
            } else {
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: "No se pudo registrar la visita, pero seguí la conversación con normalidad.",
                is_error: true,
              });
            }
          }
        }
      }

      messages.push({ role: "user", content: toolResults });
    }

    return NextResponse.json({ reply: "Dejame confirmar ese detalle y te aviso enseguida." });
  } catch (err) {
    console.error("[chat] request failed:", err);
    return NextResponse.json(
      { reply: "No pude conectarme en este momento. Probá de nuevo en unos minutos." },
      { status: 200 }
    );
  }
}

async function generateSummary(propertyId: string, visitorId: string, messages: MessageParam[]) {
  const transcript = messages
    .map((m) => {
      if (typeof m.content === "string") return `${m.role}: ${m.content}`;
      const text = m.content
        .map((block) => ("text" in block ? block.text : null))
        .filter(Boolean)
        .join(" ");
      return text ? `${m.role}: ${text}` : null;
    })
    .filter(Boolean)
    .join("\n");

  if (!transcript) return;

  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    thinking: { type: "disabled" },
    system:
      "Resumí esta conversación entre un comprador interesado y un agente inmobiliario (o su asistente) en 1-2 frases, para el panel del agente. Destacá lo más importante: qué le interesa, presupuesto o financiamiento mencionado, y el próximo paso acordado si lo hay. Respondé solo con el resumen, en español, sin introducción.",
    messages: [{ role: "user", content: transcript }],
  });

  const summary = extractText(response.content);
  if (!summary) return;

  const service = createServiceClient();
  await service.from("chat_conversations").update({ summary }).eq("property_id", propertyId).eq("visitor_id", visitorId);
}
