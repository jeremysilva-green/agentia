import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/service";
import { buildSystemPrompt } from "@/lib/chatbot/systemPrompt";
import { upsertLeadFromChatClick } from "@/lib/leads/referralProtection";
import { isPropertyType } from "@/lib/constants/propertyTypes";
import { DAY_OF_WEEK_VALUES, isDayOfWeek } from "@/lib/constants/dayOfWeek";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

const MODEL = "claude-sonnet-5";
const MAX_TOOL_ROUNDS = 3;

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
    "Registra una visita agendada cuando el interesado elige uno de los días y horarios de la disponibilidad del agente. El día y horario deben ser EXACTAMENTE una de las opciones ofrecidas. Necesita nombre y teléfono del interesado. Llamala una sola vez que confirme un día y horario concretos.",
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
      start_time: { type: "string", description: "Hora de inicio del horario elegido, formato HH:MM (24hs)" },
      end_time: { type: "string", description: "Hora de fin del horario elegido, formato HH:MM (24hs)" },
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

  // TEMP TEST BYPASS — lets you exercise real lead capture (and affiliate
  // attribution via `ref`) without a working ANTHROPIC_API_KEY. Type your
  // name and phone together in one message, in any order/punctuation (e.g.
  // "Juan Perez 0981234567", "Juan Perez, 0981234567", "0981234567 - Juan
  // Perez") and it saves the lead directly, skipping Claude entirely.
  // Remove this block once the real key is wired up.
  const testPhoneMatch = userMessage.match(/\+?\d[\d\s-]{5,}\d/);
  if (testPhoneMatch) {
    const testPhone = testPhoneMatch[0].trim();
    const testName = userMessage
      .replace(testPhoneMatch[0], "")
      .replace(/^[\s,.\-–]+|[\s,.\-–]+$/g, "")
      .trim();

    if (testName) {
      const result = await upsertLeadFromChatClick({
        propertyId,
        buyerName: testName,
        buyerPhone: testPhone,
        ref,
      });
      if ("leadId" in result) {
        return NextResponse.json({
          reply: `[TEST] Lead guardado — ${testName} (código ${result.referralCode}, ref=${ref ?? "ninguno"}).`,
        });
      }
      return NextResponse.json({ reply: `[TEST] Error al guardar el lead: ${result.error}` });
    }
  }

  const service = createServiceClient();

  const { data: property } = await service
    .from("properties")
    .select(
      "id, title, description, price, currency, city, address, property_type, bedrooms, bathrooms, area_m2, garage, negotiation_type, negotiation_details, agent_id, agent_profiles(profiles(full_name, username, phone))"
    )
    .eq("id", propertyId)
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
    .select("id, messages")
    .eq("property_id", propertyId)
    .eq("visitor_id", visitorId)
    .maybeSingle();

  const { data: availabilityRows } = await service
    .from("agent_availability")
    .select("day_of_week, start_time, end_time")
    .eq("agent_id", detail.agent_id);

  const availability = (availabilityRows ?? []).filter((row) => isDayOfWeek(row.day_of_week));

  const history = (conversation?.messages as unknown as MessageParam[] | null) ?? [];
  const messages: MessageParam[] = [...history, { role: "user", content: userMessage }];

  const system = buildSystemPrompt({
    agentName,
    agentPhone,
    propertyTitle: detail.title,
    propertyDescription: detail.description,
    propertyType: detail.property_type && isPropertyType(detail.property_type) ? detail.property_type : null,
    price: detail.price,
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
        output_config: { effort: "low" },
        system,
        tools: [SAVE_LEAD_TOOL, BOOK_VISIT_TOOL],
        messages,
      });

      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason !== "tool_use") {
        const replyText = extractText(response.content) || "Disculpá, ¿podés reformular tu consulta?";

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

          const slotMatch =
            input.day_of_week &&
            input.start_time &&
            input.end_time &&
            availability.find(
              (slot) =>
                slot.day_of_week === input.day_of_week &&
                slot.start_time.slice(0, 5) === input.start_time &&
                slot.end_time.slice(0, 5) === input.end_time
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
              content: "Ese día y horario no está entre las opciones ofrecidas. Ofrecé de nuevo solo los horarios de la disponibilidad del agente.",
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
                start_time: slotMatch.start_time,
                end_time: slotMatch.end_time,
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
  } catch {
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
    output_config: { effort: "low" },
    system:
      "Resumí esta conversación entre un comprador interesado y un agente inmobiliario (o su asistente) en 1-2 frases, para el panel del agente. Destacá lo más importante: qué le interesa, presupuesto o financiamiento mencionado, y el próximo paso acordado si lo hay. Respondé solo con el resumen, en español, sin introducción.",
    messages: [{ role: "user", content: transcript }],
  });

  const summary = extractText(response.content);
  if (!summary) return;

  const service = createServiceClient();
  await service.from("chat_conversations").update({ summary }).eq("property_id", propertyId).eq("visitor_id", visitorId);
}
