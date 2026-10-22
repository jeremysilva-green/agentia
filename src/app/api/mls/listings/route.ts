import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { hasActiveMlsAccess } from "@/lib/plans";
import { findMlsDuplicate } from "@/lib/mls/duplicateDetection";
import { createMlsNotice } from "@/lib/notices/createMlsNotice";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

function isAuthorizationType(value: unknown): value is "exclusiva" | "no_exclusiva" {
  return value === "exclusiva" || value === "no_exclusiva";
}

// "Agregar al MLS" — a Route Handler (not a Server Action) because it needs
// to accept a file upload and write it to the mls-authorizations bucket
// through the service-role client: that bucket deliberately has no
// client-facing insert policy (see 0073_mls_authorizations_bucket.sql), so
// the upload can only happen server-side, same "no self-service write"
// posture as mls_memberships/mls_notices in slice 1.
export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const propertyId = formData.get("propertyId");
  const authorizationType = formData.get("authorizationType");
  const authorizationSignedAt = formData.get("authorizationSignedAt");
  const authorizationExpiresAt = formData.get("authorizationExpiresAt");
  const cobrokePercentRaw = formData.get("cobrokePercent");
  const ownerMinPrice = formData.get("ownerMinPrice");
  const exactAddress = formData.get("exactAddress");
  const showingInstructions = formData.get("showingInstructions");
  const documentationStatus = formData.get("documentationStatus");
  const notes = formData.get("notes");
  const file = formData.get("authorizationFile");
  // Set on the resubmit after the agent dismisses the "this might already be
  // listed" warning — e.g. two different units in the same building sharing
  // one street address, which the text-based address match can't tell apart.
  const confirmDuplicate = formData.get("confirmDuplicate") === "true";

  if (typeof propertyId !== "string" || !propertyId) {
    return NextResponse.json({ error: "Falta la propiedad." }, { status: 400 });
  }
  if (!isAuthorizationType(authorizationType)) {
    return NextResponse.json({ error: "Elegí el tipo de autorización." }, { status: 400 });
  }
  if (typeof authorizationSignedAt !== "string" || !authorizationSignedAt) {
    return NextResponse.json({ error: "Ingresá la fecha de firma de la autorización." }, { status: 400 });
  }
  const cobrokePercent = Number(cobrokePercentRaw);
  if (!Number.isFinite(cobrokePercent) || cobrokePercent < 50 || cobrokePercent > 100) {
    return NextResponse.json({ error: "La oferta de cooperación debe ser al menos 50%." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Adjuntá la autorización de venta firmada." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "El archivo no puede superar los 10MB." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión expirada. Volvé a ingresar." }, { status: 401 });

  // Never trust the hidden-button gate alone — re-check both the plan and
  // membership status server-side, same principle as /api/ai-enhance and
  // /api/mls/join.
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: membership } = await supabase
    .from("mls_memberships")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!hasActiveMlsAccess(subscription) || membership?.status !== "active") {
    return NextResponse.json({ error: "El MLS es parte del Plan MLS para miembros activos." }, { status: 403 });
  }

  const { data: property } = await supabase
    .from("properties")
    .select("id, agent_id, title, city, address, property_type, listing_kind")
    .eq("id", propertyId)
    .maybeSingle();
  if (!property || property.agent_id !== user.id) {
    return NextResponse.json({ error: "Propiedad no encontrada." }, { status: 404 });
  }
  if (property.listing_kind === "modelo") {
    return NextResponse.json(
      { error: "Los modelos de construcción no tienen una dirección fija y no pueden cargarse en el MLS." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("mls_listings")
    .select("id, status")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (existing?.status === "active") {
    return NextResponse.json({ error: "Esta propiedad ya está en el MLS." }, { status: 409 });
  }

  const duplicate = await findMlsDuplicate({
    agentId: user.id,
    city: property.city,
    address: property.address,
    propertyType: property.property_type,
  });

  if (duplicate && !confirmDuplicate) {
    const service = createServiceClient();
    const { data: otherAgentProfile } = await service
      .from("profiles")
      .select("full_name, username")
      .eq("id", duplicate.agentId)
      .single();
    const otherAgentName = otherAgentProfile?.full_name || otherAgentProfile?.username || "otro agente";

    // Text-match only (city + normalized address + property type) — a soft
    // warning, not a hard block, since two different units in the same
    // building can legitimately share one street address. The agent can
    // confirm "this is a different listing" to resubmit past it.
    return NextResponse.json(
      {
        requiresDuplicateConfirmation: true,
        duplicateAgentName: otherAgentName,
        duplicatePropertyTitle: duplicate.propertyTitle,
        error: `Ya hay una propiedad cargada en el MLS en esta dirección, a nombre de ${otherAgentName}. Si es un inmueble distinto (otra unidad, por ejemplo), podés continuar igual.`,
      },
      { status: 409 }
    );
  }

  const service = createServiceClient();

  // Confirmed past the warning above — still let the other agent know, so
  // they can check whether it's genuinely the same property.
  if (duplicate && confirmDuplicate) {
    await createMlsNotice({
      recipientUserId: duplicate.agentId,
      type: "mls_listing_duplicate_blocked",
      title: "Otro agente cargó una propiedad similar a la tuya",
      body: `Un agente cargó una propiedad en la misma dirección que "${duplicate.propertyTitle}", que ya está en el MLS a tu nombre. Puede ser otra unidad, pero vale la pena revisar.`,
      eventAt: new Date(),
      listingId: duplicate.propertyId,
    });
  }

  const { data: mlsListing, error: insertError } = await service
    .from("mls_listings")
    .insert({
      property_id: propertyId,
      agent_id: user.id,
      authorization_type: authorizationType,
      authorization_signed_at: authorizationSignedAt,
      authorization_expires_at: typeof authorizationExpiresAt === "string" && authorizationExpiresAt ? authorizationExpiresAt : null,
      authorization_storage_path: "", // stamped right after upload, below
      cobroke_percent: cobrokePercent,
    })
    .select("id")
    .single();

  if (insertError || !mlsListing) {
    return NextResponse.json({ error: "No se pudo agregar la propiedad al MLS. Intentá de nuevo." }, { status: 500 });
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "pdf";
  const storagePath = `${mlsListing.id}/autorizacion.${extension}`;
  const fileBytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await service.storage
    .from("mls-authorizations")
    .upload(storagePath, fileBytes, { contentType: file.type || "application/octet-stream", upsert: true });

  if (uploadError) {
    await service.from("mls_listings").delete().eq("id", mlsListing.id);
    return NextResponse.json({ error: "No se pudo subir la autorización. Intentá de nuevo." }, { status: 500 });
  }

  await service.from("mls_listings").update({ authorization_storage_path: storagePath }).eq("id", mlsListing.id);

  const { error: privateError } = await service.from("mls_listing_private").insert({
    mls_listing_id: mlsListing.id,
    owner_min_price: typeof ownerMinPrice === "string" && ownerMinPrice ? Number(ownerMinPrice) : null,
    exact_address: typeof exactAddress === "string" && exactAddress ? exactAddress : null,
    showing_instructions: typeof showingInstructions === "string" && showingInstructions ? showingInstructions : null,
    documentation_status: typeof documentationStatus === "string" && documentationStatus ? documentationStatus : null,
    notes: typeof notes === "string" && notes ? notes : null,
  });
  if (privateError) {
    return NextResponse.json({ error: "No se pudo guardar la información privada. Intentá de nuevo." }, { status: 500 });
  }

  await createMlsNotice({
    recipientUserId: user.id,
    type: "mls_listing_added",
    title: "Tu propiedad ya está en el MLS",
    body: `"${property.title}" ya está en el MLS. Otros miembros activos ya pueden verla y registrar compradores.`,
    eventAt: new Date(),
    listingId: propertyId,
  });

  return NextResponse.json({ ok: true, mlsListingId: mlsListing.id });
}
