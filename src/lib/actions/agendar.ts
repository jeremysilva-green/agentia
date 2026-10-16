"use server";

import { upsertLeadFromChatClick } from "@/lib/leads/referralProtection";
import { isPlausiblePhone } from "@/lib/phone";

// Visitor-facing "Agendar visita" form on the property page. Deliberately
// only touches the `leads` table (via the same upsert the chat bot's
// save_lead_contact/book_visit tools use) — no day/time is collected here,
// so there's no `agendamientos` row to create; the agent follows up
// manually, matching the modal's own copy ("me comunico contigo en la
// semana").
export async function requestVisit({
  propertyId,
  buyerName,
  buyerPhone,
  ref,
}: {
  propertyId: string;
  buyerName: string;
  buyerPhone: string;
  ref?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const name = buyerName.trim();
  const phone = buyerPhone.trim();

  if (!name) return { error: "Ingresá tu nombre." };
  if (!isPlausiblePhone(phone)) return { error: "Ingresá un WhatsApp válido." };

  const result = await upsertLeadFromChatClick({ propertyId, buyerName: name, buyerPhone: phone, ref: ref ?? null });
  if ("error" in result) return result;
  return { ok: true };
}
