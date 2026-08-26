"use server";

import { revalidatePath } from "next/cache";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { AFFILIATE_COMMISSION_PCT } from "@/lib/constants/commission";
import { isLeadStatus, type LeadStatus } from "@/lib/constants/leadStatus";
import { getSiteUrl } from "@/lib/siteUrl";
import { generateCommissionAgreementPdf } from "@/lib/reports/commissionAgreementPdf";

export type LeadActionState = { error?: string } | undefined;

export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<LeadActionState> {
  if (!isLeadStatus(status)) return { error: "Estado inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const { data: lead } = await supabase
    .from("leads")
    .select("id, agent_id, affiliate_link_id, property_id")
    .eq("id", leadId)
    .single();
  if (!lead || lead.agent_id !== user.id) return { error: "No se encontró el lead." };
  if (status === "sold" && lead.affiliate_link_id) {
    return { error: "Este lead tiene un afiliado asociado: usá 'Trato cerrado' para calcular la comisión." };
  }

  const service = createServiceClient();
  const { error } = await service.from("leads").update({ status }).eq("id", leadId);
  if (error) return { error: "No se pudo actualizar el estado." };

  // Marking a lead sold means the property itself is sold — flip its status
  // too so it stops showing as available and any affiliates who promoted it
  // (even via a different, non-winning lead) see it in their "Avisos" tab.
  // Leads sourced from a Cliente Vendedor/Comprador submission have no
  // property yet, so there's nothing to sync in that case.
  if (status === "sold" && lead.property_id) {
    await service
      .from("properties")
      .update({ status: "sold", sold_at: new Date().toISOString() })
      .eq("id", lead.property_id);
    revalidatePath("/panel/propiedades");
    revalidatePath("/");
  }

  revalidatePath("/panel/leads");
  revalidatePath("/panel-afiliado");
  return undefined;
}

async function generateDealReportPdf(details: {
  propertyTitle: string;
  currency: string;
  agentName: string;
  agentPhone: string | null;
  affiliateName: string | null;
  buyerName: string;
  referralCode: string;
  salePrice: number;
  commissionPct: number;
  commissionAmount: number;
  closedAt: Date;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 480]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 420;
  const line = (text: string, size = 12, useBold = false, color = rgb(0.15, 0.15, 0.15)) => {
    page.drawText(text, { x: 50, y, size, font: useBold ? bold : font, color });
    y -= size + 12;
  };

  const money = (amount: number) => `${details.currency} ${amount.toLocaleString("es-PY")}`;

  line("Agentia — Reporte de cierre de trato", 20, true, rgb(0.02, 0.4, 0.25));
  y -= 8;
  line(`Código de referido: ${details.referralCode}`);
  line(`Propiedad: ${details.propertyTitle}`);
  line(`Comprador: ${details.buyerName}`);
  line(`Agente: ${details.agentName}${details.agentPhone ? ` · ${details.agentPhone}` : ""}`);
  if (details.affiliateName) line(`Afiliado: ${details.affiliateName}`);
  line(
    `Fecha de cierre: ${details.closedAt.toLocaleDateString("es-PY", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`
  );
  y -= 8;
  line(`Precio de venta: ${money(details.salePrice)}`, 13, true);
  line(
    `Comisión de afiliado (${details.commissionPct}%): ${money(details.commissionAmount)}`,
    14,
    true,
    rgb(0.02, 0.4, 0.25)
  );
  y -= 8;
  line("Este reporte se generó automáticamente al confirmar el cierre del trato.", 10);
  line("Usalo como recordatorio para coordinar el pago de la comisión entre", 10);
  line("el agente y el afiliado.", 10);

  return pdfDoc.save();
}

export async function closeLeadDeal(
  leadId: string,
  salePrice: number
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  if (!Number.isFinite(salePrice) || salePrice <= 0) return { error: "Ingresá un precio de venta válido." };

  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, buyer_name, referral_code, commission_confirmed_at, property_id, affiliate_link_id, properties!inner(title, agent_id, currency, agent_profiles(profiles(full_name, username, phone))), affiliate_links(profiles(full_name, username))"
    )
    .eq("id", leadId)
    .single();

  type LeadDetail = {
    id: string;
    buyer_name: string;
    referral_code: string;
    commission_confirmed_at: string | null;
    property_id: string;
    affiliate_link_id: string | null;
    properties: {
      title: string;
      agent_id: string;
      currency: string;
      agent_profiles: { profiles: { full_name: string | null; username: string; phone: string | null } | null } | null;
    } | null;
    affiliate_links: { profiles: { full_name: string | null; username: string } | null } | null;
  };

  const detail = lead as unknown as LeadDetail | null;
  if (!detail || !detail.properties) return { error: "No se encontró el lead." };
  if (detail.properties.agent_id !== user.id) {
    return { error: "Solo el agente dueño de la propiedad puede cerrar este trato." };
  }
  if (!detail.affiliate_link_id) return { error: "Este lead no tiene un afiliado asociado." };
  if (detail.commission_confirmed_at) return { error: "Este trato ya fue cerrado." };

  const agentProfile = detail.properties.agent_profiles?.profiles;
  const affiliateProfile = detail.affiliate_links?.profiles;
  const closedAt = new Date();
  const commissionPct = AFFILIATE_COMMISSION_PCT;
  const commissionAmount = Math.round(salePrice * (commissionPct / 100));

  const pdfBytes = await generateDealReportPdf({
    propertyTitle: detail.properties.title,
    currency: detail.properties.currency,
    agentName: agentProfile?.full_name || agentProfile?.username || "Agente",
    agentPhone: agentProfile?.phone ?? null,
    affiliateName: affiliateProfile ? affiliateProfile.full_name || affiliateProfile.username : null,
    buyerName: detail.buyer_name,
    referralCode: detail.referral_code,
    salePrice,
    commissionPct,
    commissionAmount,
    closedAt,
  });

  const service = createServiceClient();
  const reportPath = `${leadId}.pdf`;

  const { error: uploadError } = await service.storage.from("deal-reports").upload(reportPath, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (uploadError) return { error: "No se pudo generar el reporte. Intentá de nuevo." };

  const { error: updateError } = await service
    .from("leads")
    .update({
      status: "sold",
      sale_price: salePrice,
      commission_pct: commissionPct,
      commission_amount: commissionAmount,
      commission_confirmed_at: closedAt.toISOString(),
      report_path: reportPath,
    })
    .eq("id", leadId);

  if (updateError) return { error: "No se pudo actualizar el trato." };

  await service
    .from("properties")
    .update({ status: "sold", sold_at: closedAt.toISOString() })
    .eq("id", detail.property_id);

  revalidatePath("/panel/leads");
  revalidatePath("/panel-afiliado");
  revalidatePath("/panel/propiedades");
  revalidatePath("/");

  return { success: true };
}

export async function markCommissionPaid(leadId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const { data: lead } = await supabase
    .from("leads")
    .select("id, agent_id, commission_confirmed_at, commission_paid_at")
    .eq("id", leadId)
    .single();
  if (!lead || lead.agent_id !== user.id) return { error: "No se encontró el trato." };
  if (!lead.commission_confirmed_at) return { error: "Este trato todavía no tiene una comisión confirmada." };
  if (lead.commission_paid_at) return { error: "Esta comisión ya fue marcada como pagada." };

  const service = createServiceClient();
  const { error } = await service
    .from("leads")
    .update({ commission_paid_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) return { error: "No se pudo actualizar el trato." };

  revalidatePath("/panel/leads");
  revalidatePath("/panel-afiliado");

  return { success: true };
}

type CommissionAgreementContext = {
  agentName: string;
  agentCiOrRuc: string;
  affiliateName: string;
  affiliateCi: string;
  propertyLabel: string;
  saleValueLabel: string;
  referralLink: string;
  operationDate: string;
  commissionPct: number;
  commissionAmountLabel: string;
  alreadyAccepted: boolean;
};

// Shared by the read-only preview (rendered in the mandatory "Acepto" modal
// before the agent accepts) and the accept action itself, which re-fetches
// fresh rather than trusting client-echoed values for what goes into the
// legal PDF.
async function loadCommissionAgreementContext(
  leadId: string,
  agentUserId: string
): Promise<CommissionAgreementContext | { error: string }> {
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, agent_id, affiliate_link_id, property_id, sale_price, commission_pct, commission_amount, commission_confirmed_at, commission_agreement_accepted_at, properties(title, address, city, currency, agent_profiles(slug, ruc, profiles(full_name, username))), affiliate_links(profiles(full_name, username, ci))"
    )
    .eq("id", leadId)
    .single();

  type Detail = {
    id: string;
    agent_id: string;
    affiliate_link_id: string | null;
    property_id: string | null;
    sale_price: number | null;
    commission_pct: number | null;
    commission_amount: number | null;
    commission_confirmed_at: string | null;
    commission_agreement_accepted_at: string | null;
    properties: {
      title: string;
      address: string | null;
      city: string;
      currency: string;
      agent_profiles: {
        slug: string;
        ruc: string | null;
        profiles: { full_name: string | null; username: string } | null;
      } | null;
    } | null;
    affiliate_links: { profiles: { full_name: string | null; username: string; ci: string | null } | null } | null;
  };

  const detail = lead as unknown as Detail | null;
  if (!detail) return { error: "No se encontró el lead." };
  if (detail.agent_id !== agentUserId) {
    return { error: "Solo el agente dueño de la propiedad puede acceder a este acuerdo." };
  }
  if (!detail.affiliate_link_id) return { error: "Este lead no tiene un afiliado asociado." };
  if (!detail.commission_confirmed_at) return { error: "Primero cerrá el trato para generar el acuerdo." };

  const agentProfile = detail.properties?.agent_profiles?.profiles;
  const agentRuc = detail.properties?.agent_profiles?.ruc;
  const affiliateProfile = detail.affiliate_links?.profiles;
  const agentSlug = detail.properties?.agent_profiles?.slug;
  const affiliateUsername = affiliateProfile?.username;
  const siteUrl = getSiteUrl();

  let referralLink =
    agentSlug && detail.property_id && affiliateUsername
      ? `${siteUrl}/agentes/${agentSlug}/propiedades/${detail.property_id}?ref=${encodeURIComponent(affiliateUsername)}`
      : "N/D";

  if (detail.property_id && affiliateUsername) {
    const { data: shortLink } = await supabase
      .from("short_links")
      .select("code")
      .eq("property_id", detail.property_id)
      .eq("ref", affiliateUsername)
      .maybeSingle();
    if (shortLink) referralLink = `${siteUrl}/s/${shortLink.code}`;
  }

  const currency = detail.properties?.currency ?? "PYG";
  const money = (amount: number) => `${currency} ${amount.toLocaleString("es-PY")}`;

  return {
    agentName: agentProfile?.full_name || agentProfile?.username || "Agente",
    agentCiOrRuc: agentRuc || "(sin definir)",
    affiliateName: affiliateProfile?.full_name || affiliateProfile?.username || "Afiliado",
    affiliateCi: affiliateProfile?.ci || "(CI pendiente)",
    propertyLabel: detail.properties?.address
      ? `${detail.properties.title} — ${detail.properties.address}`
      : `${detail.properties?.title ?? "Propiedad"} — ${detail.properties?.city ?? ""}`,
    saleValueLabel: money(detail.sale_price ?? 0),
    referralLink,
    operationDate: new Date(detail.commission_confirmed_at).toLocaleDateString("es-PY", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    commissionPct: detail.commission_pct ?? AFFILIATE_COMMISSION_PCT,
    commissionAmountLabel: money(detail.commission_amount ?? 0),
    alreadyAccepted: Boolean(detail.commission_agreement_accepted_at),
  };
}

export type CommissionAgreementPreview = Omit<CommissionAgreementContext, "alreadyAccepted">;

export async function getCommissionAgreementPreview(
  leadId: string
): Promise<CommissionAgreementPreview | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const context = await loadCommissionAgreementContext(leadId, user.id);
  if ("error" in context) return context;

  const { alreadyAccepted: _alreadyAccepted, ...preview } = context;
  return preview;
}

export async function acceptCommissionAgreement(leadId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const context = await loadCommissionAgreementContext(leadId, user.id);
  if ("error" in context) return context;
  if (context.alreadyAccepted) return { error: "Este acuerdo ya fue aceptado." };

  const acceptedAt = new Date();
  const pdfBytes = await generateCommissionAgreementPdf({
    agentName: context.agentName,
    agentCiOrRuc: context.agentCiOrRuc,
    affiliateName: context.affiliateName,
    affiliateCi: context.affiliateCi,
    propertyLabel: context.propertyLabel,
    saleValueLabel: context.saleValueLabel,
    referralLink: context.referralLink,
    operationDate: context.operationDate,
    commissionPct: context.commissionPct,
    commissionAmountLabel: context.commissionAmountLabel,
    acceptedAt,
  });

  const service = createServiceClient();
  const agreementPath = `${leadId}-contrato.pdf`;

  const { error: uploadError } = await service.storage
    .from("commission-agreements")
    .upload(agreementPath, pdfBytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) return { error: "No se pudo generar el acuerdo. Intentá de nuevo." };

  const { error: updateError } = await service
    .from("leads")
    .update({ commission_agreement_accepted_at: acceptedAt.toISOString(), commission_agreement_path: agreementPath })
    .eq("id", leadId);
  if (updateError) return { error: "No se pudo guardar la aceptación. Intentá de nuevo." };

  revalidatePath("/panel/leads");
  revalidatePath("/panel-afiliado");
  revalidatePath("/panel-afiliado/avisos");

  return { success: true };
}
