"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { propertySchema, type PropertyInput } from "@/lib/validations/property";
import { extractLatLngFromMapsUrl } from "@/lib/googleMaps";
import { fieldErrorsFrom, firstIssueMessage } from "@/lib/formErrors";
import { getSiteUrl } from "@/lib/siteUrl";
import {
  MODELO_REFERRAL_REWARD_PCT,
  AGENT_COMMISSION_PCT,
  AFFILIATE_SHARE_DEFAULT_PCT,
} from "@/lib/constants/commission";
import { BASICO_PROPERTY_LIMIT } from "@/lib/plans";

const MAKE_INSTAGRAM_WEBHOOK_URL = "https://hook.us2.make.com/mco3oi9a6gqkvqu69529c8ywufui3xok";

// Queues an Instagram post for a property save (create or update) by
// inserting a row into `generation_requests` and notifying Make.com.
// `generation_requests` has RLS enabled with no policies, so this needs the
// service-role client — the regular session-scoped client used elsewhere in
// this file can't write to it at all. Never throws: a failure here (missing
// slug, DB error, webhook unreachable) is logged but must never block the
// property save itself, so every step is wrapped and swallowed internally.
async function queueInstagramPost(propertyId: string, agentId: string, listingKind: string) {
  // Proyecto en Pozo / Modelo listings aren't understood by this pipeline's
  // post image (the property-card route still needs its own kind-aware
  // price branch regardless of this guard — see route.tsx) and would leak
  // a Modelo listing's private precio contado into a public Instagram post.
  if (listingKind !== "standard") return;
  try {
    const service = createServiceClient();

    const { data: agentProfile } = await service
      .from("agent_profiles")
      .select("slug")
      .eq("id", agentId)
      .single();

    if (!agentProfile?.slug) {
      console.error("[queueInstagramPost] no agent slug found for agent", agentId);
      return;
    }

    const propertyLink = `${getSiteUrl()}/agentes/${agentProfile.slug}/propiedades/${propertyId}`;

    const { data: row, error: insertError } = await service
      .from("generation_requests")
      .insert({ property_link: propertyLink, status: "pending" })
      .select("id, property_link, status")
      .single();

    if (insertError || !row) {
      console.error("[queueInstagramPost] failed to insert generation_requests row", insertError);
      return;
    }

    const secret = process.env.MAKE_INSTAGRAM_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[queueInstagramPost] MAKE_INSTAGRAM_WEBHOOK_SECRET is not set — skipping webhook call");
      return;
    }

    const response = await fetch(MAKE_INSTAGRAM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-webhook-secret": secret },
      body: JSON.stringify({
        type: "INSERT",
        table: "generation_requests",
        record: { id: row.id, property_link: row.property_link, status: row.status },
      }),
    });

    if (!response.ok) {
      console.error("[queueInstagramPost] Make.com webhook returned", response.status, await response.text());
    }
  } catch (err) {
    console.error("[queueInstagramPost] unexpected failure", err);
  }
}

// Called directly from PropertyPhotoManager (a client component) right
// after a property's first photo finishes uploading — the one point in the
// flow where we can guarantee an image actually exists before Make.com
// goes to render it. Exported server actions are directly callable by
// anyone, not just from the UI that references them, so this independently
// verifies the authenticated caller actually owns the property rather than
// trusting a client-supplied agentId.
export async function notifyFirstPhotoAdded(propertyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: property } = await supabase
    .from("properties")
    .select("id, listing_kind")
    .eq("id", propertyId)
    .eq("agent_id", user.id)
    .maybeSingle();
  if (!property) return;

  await queueInstagramPost(propertyId, user.id, property.listing_kind);
}

export type PropertyActionState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

// Only Básico agents are capped — Pro/Fundador are unlimited. "Activas"
// means status="available"; drafts and sold properties don't count against
// the limit, matching the plan copy ("Hasta 6 propiedades activas").
async function checkPropertyLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agentId: string,
  excludePropertyId?: string
): Promise<string | null> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if ((subscription?.plan ?? "basico") !== "basico") return null;

  let query = supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .eq("status", "available");
  if (excludePropertyId) query = query.neq("id", excludePropertyId);

  const { count } = await query;
  if ((count ?? 0) >= BASICO_PROPERTY_LIMIT) {
    return `Alcanzaste el límite de ${BASICO_PROPERTY_LIMIT} propiedades activas del plan Básico. Actualizá a Pro para publicar sin límites.`;
  }
  return null;
}

// Lets the panel gate the "Nueva propiedad" button itself, before the agent
// ever reaches the creation form — mirrors checkPropertyLimit's Básico/
// active-count logic but re-derives the caller from the session instead of
// trusting a client-supplied agentId.
export async function isAtPropertyLimit(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if ((subscription?.plan ?? "basico") !== "basico") return false;

  const { count } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", user.id)
    .eq("status", "available");

  return (count ?? 0) >= BASICO_PROPERTY_LIMIT;
}

// Called after an agent downgrades to Básico (via cancelSubscription or
// selectPlan) so an agent who had more than BASICO_PROPERTY_LIMIT active
// properties on Pro/Fundador doesn't keep them all publicly visible on a
// free plan. Never deletes anything — unpublishes the extra ones, keeping
// the most recently created BASICO_PROPERTY_LIMIT visible; the rest can be
// republished manually (or automatically, if that gets built later) if the
// agent upgrades again.
export async function enforceBasicoPropertyLimit(agentId: string): Promise<void> {
  const service = createServiceClient();

  const { data: activeProperties } = await service
    .from("properties")
    .select("id")
    .eq("agent_id", agentId)
    .eq("status", "available")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const excess = (activeProperties ?? []).slice(BASICO_PROPERTY_LIMIT);
  if (excess.length === 0) return;

  await service
    .from("properties")
    .update({ published: false, hidden_by_downgrade: true })
    .in(
      "id",
      excess.map((p) => p.id)
    );
}

// Counterpart to enforceBasicoPropertyLimit — called once a Pro/Fundador
// payment is actually confirmed (Pagopar webhook, Bancard webhook), so
// properties that were auto-hidden by a previous downgrade come back
// automatically. Only touches rows still flagged
// hidden_by_downgrade, so a property the agent deliberately unpublished
// themselves (which never gets that flag, or has it cleared by an explicit
// re-publish in updateProperty) is left alone.
export async function restoreHiddenPropertiesOnUpgrade(agentId: string): Promise<void> {
  const service = createServiceClient();

  await service
    .from("properties")
    .update({ published: true, hidden_by_downgrade: false })
    .eq("agent_id", agentId)
    .eq("hidden_by_downgrade", true);
}

function readPropertyForm(formData: FormData) {
  const coverageCities = formData.getAll("coverageCities").map(String);
  // Modelo listings hide the city/address block entirely (replaced by Zona
  // de cobertura) — city stays NOT NULL at the DB level, so it's defaulted
  // here to the first covered city, a real meaningful value every
  // kind-unaware consumer (chatbot, marketing-video types, etc.) can use.
  const city = formData.get("city") || (coverageCities[0] ?? undefined);

  return propertySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    listingType: formData.get("listingType"),
    propertyType: formData.get("propertyType") || undefined,
    price: formData.get("price"),
    currency: formData.get("currency") || undefined,
    priceIncludesIva: formData.get("priceIncludesIva") === "on",
    city,
    address: formData.get("address") || undefined,
    mapsUrl: formData.get("mapsUrl") || undefined,
    youtubeUrl: formData.get("youtubeUrl") || undefined,
    instagramReelUrl: formData.get("instagramReelUrl") || undefined,
    status: formData.get("status") || "available",
    published: formData.get("published") === "on",
    bedrooms: formData.get("bedrooms") || undefined,
    bathrooms: formData.get("bathrooms") || undefined,
    areaM2: formData.get("areaM2") || undefined,
    garage: formData.get("garage") || "false",
    negotiationType: formData.getAll("negotiationType"),
    negotiationDetails: formData.get("negotiationDetails") || undefined,

    listingKind: formData.get("listingKind") || "standard",
    constructionStage: formData.get("constructionStage") || "terminada",

    developerName: formData.get("developerName") || undefined,
    estimatedDeliveryDate: formData.get("estimatedDeliveryDate") || undefined,
    constructionProgressPct: formData.get("constructionProgressPct") || undefined,
    totalUnits: formData.get("totalUnits") || undefined,
    paymentPlanDepositPct: formData.get("paymentPlanDepositPct") || undefined,
    paymentPlanInstallmentsText: formData.get("paymentPlanInstallmentsText") || undefined,
    paymentPlanBalancePct: formData.get("paymentPlanBalancePct") || undefined,
    paymentPlanFinancingOptions: formData.getAll("paymentPlanFinancingOptions"),
    typologyName: formData.getAll("typologyName"),
    typologyBedrooms: formData.getAll("typologyBedrooms"),
    typologyAreaM2: formData.getAll("typologyAreaM2"),
    typologyPriceFrom: formData.getAll("typologyPriceFrom"),
    typologyUnitsAvailable: formData.getAll("typologyUnitsAvailable"),

    coverageCities,
    modelConstructionTermMonths: formData.get("modelConstructionTermMonths") || undefined,
    modelIncludesLand: formData.get("modelIncludesLand") || undefined,
    modelMaterialsText: formData.get("modelMaterialsText") || undefined,
    modelFinancingType: formData.get("modelFinancingType") || undefined,
    modelInstallmentFrom: formData.get("modelInstallmentFrom") || undefined,
    modelDownPaymentText: formData.get("modelDownPaymentText") || undefined,
    modelQualifyingRequirements: formData.get("modelQualifyingRequirements") || undefined,

    commissionTriggerLabel: formData.get("commissionTriggerLabel") || undefined,
    commissionAgentPct: formData.get("commissionAgentPct") || undefined,
    commissionAgentType: formData.get("commissionAgentType") || undefined,
    commissionAgentAmount: formData.get("commissionAgentAmount") || undefined,
    commissionVatIncluded: formData.get("commissionVatIncluded") || undefined,
    referralRewardType: formData.get("referralRewardType") || undefined,
    referralRewardValue: formData.get("referralRewardValue") || undefined,
    referralAttributionDays: formData.get("referralAttributionDays") || undefined,
  });
}

// Typology rows are only meaningful for proyecto_en_pozo and are read as
// four parallel arrays (TypologyEditor emits one hidden input set per row,
// all sharing the same name) — zipped back into objects by index here.
function zipTypologies(parsed: {
  typologyName: string[];
  typologyBedrooms: string[];
  typologyAreaM2: string[];
  typologyPriceFrom: string[];
  typologyUnitsAvailable: string[];
}) {
  return parsed.typologyName
    .map((name, i) => ({
      name: name.trim(),
      bedrooms: parsed.typologyBedrooms[i] ? Number(parsed.typologyBedrooms[i]) : null,
      area_m2: parsed.typologyAreaM2[i] ? Number(parsed.typologyAreaM2[i]) : null,
      price_from: parsed.typologyPriceFrom[i] ? Number(parsed.typologyPriceFrom[i]) : null,
      units_available: parsed.typologyUnitsAvailable[i] ? Number(parsed.typologyUnitsAvailable[i]) : null,
      position: i,
    }))
    .filter((row) => row.name !== "");
}

async function resolveMapCoordinates(mapsUrl: string | undefined) {
  if (!mapsUrl) return { lat: null, lng: null, mapsUrl: null, error: null as string | null };

  const coordinates = await extractLatLngFromMapsUrl(mapsUrl);
  if (!coordinates) {
    return {
      lat: null,
      lng: null,
      mapsUrl,
      error: "No pudimos leer la ubicación de ese enlace. Probá copiándolo de nuevo desde Google Maps.",
    };
  }

  return { lat: coordinates.lat, lng: coordinates.lng, mapsUrl, error: null };
}

// Shared by createProperty/updateProperty — every field here is nullable at
// the DB level and unused by the standard path, so this is safe to spread
// into both the insert and update payloads regardless of listing_kind.
function listingKindFields(data: PropertyInput) {
  return {
    listing_kind: data.listingKind,
    construction_stage: data.constructionStage,
    developer_name: data.developerName ?? null,
    estimated_delivery_date: data.estimatedDeliveryDate ?? null,
    construction_progress_pct: data.constructionProgressPct ?? null,
    total_units: data.totalUnits ?? null,
    payment_plan_deposit_pct: data.paymentPlanDepositPct ?? null,
    payment_plan_installments_text: data.paymentPlanInstallmentsText ?? null,
    payment_plan_balance_pct: data.paymentPlanBalancePct ?? null,
    payment_plan_financing_options: data.paymentPlanFinancingOptions,
    model_materials_text: data.modelMaterialsText ?? null,
    model_construction_term_months: data.modelConstructionTermMonths ?? null,
    model_includes_land: data.modelIncludesLand ?? null,
    model_financing_type: data.modelFinancingType ?? null,
    model_installment_from: data.modelInstallmentFrom ?? null,
    model_down_payment_text: data.modelDownPaymentText ?? null,
    model_qualifying_requirements: data.modelQualifyingRequirements ?? null,
    commission_trigger_label: data.commissionTriggerLabel ?? null,
    // Standard listings always carry their commission (default 5.5%) and the
    // affiliate's share of it (default 10%, capped by the validation).
    commission_agent_pct:
      data.listingKind === "standard" ? (data.commissionAgentPct ?? AGENT_COMMISSION_PCT) : (data.commissionAgentPct ?? null),
    // Fixed-amount commission only applies to standard and Proyecto en Pozo;
    // Modelo keeps its single "tu comisión" figure.
    commission_agent_type: data.listingKind === "modelo" ? "percentage" : data.commissionAgentType,
    commission_agent_amount:
      data.listingKind !== "modelo" && data.commissionAgentType === "fixed" ? (data.commissionAgentAmount ?? null) : null,
    commission_vat_included: data.commissionVatIncluded,
    // Modelo's referral reward is fixed at MODELO_REFERRAL_REWARD_PCT, not
    // agent-configurable — enforced here rather than trusting the submitted
    // form fields, which the modelo form no longer even renders as editable.
    referral_reward_type:
      data.listingKind === "modelo"
        ? "percentage"
        : data.listingKind === "standard"
          ? "commission_share"
          : (data.referralRewardType ?? null),
    referral_reward_value:
      data.listingKind === "modelo"
        ? MODELO_REFERRAL_REWARD_PCT
        : data.listingKind === "standard"
          ? (data.referralRewardValue ?? AFFILIATE_SHARE_DEFAULT_PCT)
          : (data.referralRewardValue ?? null),
    referral_attribution_days: data.referralAttributionDays ?? null,
  };
}

// Replaces property_typologies/property_coverage_cities wholesale — safe
// here (unlike property_images) since nothing references these child rows'
// ids by stable identity across edits.
async function saveListingKindChildren(
  supabase: Awaited<ReturnType<typeof createClient>>,
  propertyId: string,
  data: PropertyInput
) {
  if (data.listingKind === "proyecto_en_pozo") {
    await supabase.from("property_typologies").delete().eq("property_id", propertyId);
    const rows = zipTypologies(data).map((row) => ({ ...row, property_id: propertyId }));
    if (rows.length > 0) await supabase.from("property_typologies").insert(rows);
  } else {
    await supabase.from("property_typologies").delete().eq("property_id", propertyId);
  }

  if (data.listingKind === "modelo") {
    await supabase.from("property_coverage_cities").delete().eq("property_id", propertyId);
    const rows = data.coverageCities.map((city) => ({ property_id: propertyId, city }));
    if (rows.length > 0) await supabase.from("property_coverage_cities").insert(rows);
  } else {
    await supabase.from("property_coverage_cities").delete().eq("property_id", propertyId);
  }
}

export async function createProperty(
  _prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const parsed = readPropertyForm(formData);
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error), fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  if (parsed.data.status === "available") {
    const limitError = await checkPropertyLimit(supabase, user.id);
    if (limitError) return { error: limitError };
  }

  const map = await resolveMapCoordinates(parsed.data.mapsUrl);
  if (map.error) return { error: map.error };

  const { data, error } = await supabase
    .from("properties")
    .insert({
      agent_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      listing_type: parsed.data.listingType,
      property_type: parsed.data.propertyType ?? null,
      price: parsed.data.price,
      currency: parsed.data.currency,
      price_includes_iva: parsed.data.priceIncludesIva,
      city: parsed.data.city,
      address: parsed.data.address ?? null,
      lat: map.lat,
      lng: map.lng,
      maps_url: map.mapsUrl,
      youtube_url: parsed.data.youtubeUrl || null,
      instagram_reel_url: parsed.data.instagramReelUrl || null,
      status: parsed.data.status,
      published: parsed.data.published,
      bedrooms: parsed.data.bedrooms ?? null,
      bathrooms: parsed.data.bathrooms ?? null,
      area_m2: parsed.data.areaM2 ?? null,
      garage: parsed.data.garage,
      negotiation_type: parsed.data.negotiationType,
      negotiation_details: parsed.data.negotiationDetails ?? null,
      sold_at: parsed.data.status === "sold" ? new Date().toISOString() : null,
      ...listingKindFields(parsed.data),
    })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear la propiedad. Intentá de nuevo." };

  await saveListingKindChildren(supabase, data.id, parsed.data);

  // Instagram post is queued once the first photo is actually uploaded (see
  // notifyFirstPhotoAdded, called from PropertyPhotoManager) — not here.
  // A brand-new property never has photos yet at this point (they're added
  // afterward, on the edit page this redirects to), so queuing here would
  // hand Make.com a property with nothing to render.
  revalidatePath("/panel/propiedades");
  redirect(`/panel/propiedades/${data.id}/editar`);
}

export async function updateProperty(
  propertyId: string,
  _prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const parsed = readPropertyForm(formData);
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error), fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  if (parsed.data.status === "available") {
    const limitError = await checkPropertyLimit(supabase, user.id, propertyId);
    if (limitError) return { error: limitError };
  }

  const map = await resolveMapCoordinates(parsed.data.mapsUrl);
  if (map.error) return { error: map.error };

  const { data: current } = await supabase
    .from("properties")
    .select("status, sold_at")
    .eq("id", propertyId)
    .eq("agent_id", user.id)
    .single();

  const soldAt =
    parsed.data.status === "sold"
      ? (current?.sold_at ?? new Date().toISOString())
      : null;

  const { error } = await supabase
    .from("properties")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      listing_type: parsed.data.listingType,
      property_type: parsed.data.propertyType ?? null,
      price: parsed.data.price,
      currency: parsed.data.currency,
      price_includes_iva: parsed.data.priceIncludesIva,
      city: parsed.data.city,
      address: parsed.data.address ?? null,
      lat: map.lat,
      lng: map.lng,
      maps_url: map.mapsUrl,
      youtube_url: parsed.data.youtubeUrl || null,
      instagram_reel_url: parsed.data.instagramReelUrl || null,
      status: parsed.data.status,
      published: parsed.data.published,
      // A deliberate re-publish overrides any earlier automatic downgrade
      // hide — otherwise a later plan upgrade would try to "restore" a
      // property the agent already brought back themselves.
      ...(parsed.data.published ? { hidden_by_downgrade: false } : {}),
      bedrooms: parsed.data.bedrooms ?? null,
      bathrooms: parsed.data.bathrooms ?? null,
      area_m2: parsed.data.areaM2 ?? null,
      garage: parsed.data.garage,
      negotiation_type: parsed.data.negotiationType,
      negotiation_details: parsed.data.negotiationDetails ?? null,
      sold_at: soldAt,
      ...listingKindFields(parsed.data),
    })
    .eq("id", propertyId)
    .eq("agent_id", user.id);

  if (error) return { error: "No se pudo guardar los cambios." };

  await saveListingKindChildren(supabase, propertyId, parsed.data);

  // Instagram post is only queued on creation (see createProperty) — an
  // agent typically saves again right after adding photos, which was
  // queueing a near-identical second post for the same property within
  // seconds of the first (confirmed via generation_requests timestamps and
  // showing up as real duplicate drafts in Buffer).
  revalidatePath("/panel/propiedades");
  revalidatePath(`/panel/propiedades/${propertyId}/editar`);
  redirect("/panel/propiedades");
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };

  // marketing_videos cascades on the row (FK on delete cascade), but that
  // only removes the DB record — the MP4 itself would otherwise orphan in
  // the marketing-videos bucket, so it's deleted explicitly here first.
  const { data: video } = await supabase
    .from("marketing_videos")
    .select("storage_path")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (video) {
    const service = createServiceClient();
    await service.storage.from("marketing-videos").remove([video.storage_path]);
  }

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId)
    .eq("agent_id", user.id);

  if (error) return { error: "No se pudo eliminar la propiedad." };

  revalidatePath("/panel/propiedades");
  return { success: true };
}
