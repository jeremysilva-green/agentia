import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, User, BedDouble, Bath, Ruler, Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPropertyForPublicView } from "@/lib/data/agentPortfolio";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertyVideo } from "@/components/property/PropertyVideo";
import { PropertyMap } from "@/components/property/PropertyMap";
import { ChatWidget } from "@/components/property/ChatWidget";
import { ShareButton } from "@/components/property/ShareButton";
import { AgentShareButton } from "@/components/property/AgentShareButton";
import { LeadTracker } from "@/components/property/LeadTracker";
import { TypologiesTable } from "@/components/property/TypologiesTable";
import { ModeloReferralCard } from "@/components/property/ModeloReferralCard";
import { Badge } from "@/components/ui/Badge";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { copy } from "@/lib/copy";
import { getSiteUrl } from "@/lib/siteUrl";

const statusLabel = {
  available: copy.property.available,
  sold: copy.property.sold,
  rented: copy.property.rented,
  draft: "Borrador",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentSlug: string; propertyId: string }>;
}): Promise<Metadata> {
  const { propertyId } = await params;
  const property = await getPropertyForPublicView(propertyId);
  if (!property) return {};

  const siteUrl = getSiteUrl();
  const imageUrl = `${siteUrl}/api/property-card/${propertyId}`;
  // Modelo listings have no public price — property.price is the private
  // precio contado and must never reach a crawler-visible description.
  const description =
    property.listing_kind === "modelo"
      ? `Construimos en tu terreno · Cuota desde ${new Intl.NumberFormat("es-PY", {
          style: "currency",
          currency: property.currency,
          maximumFractionDigits: 0,
        }).format(property.model_installment_from ?? 0)}/mes`
      : `${property.city} · ${new Intl.NumberFormat("es-PY", {
          style: "currency",
          currency: property.currency,
        }).format(property.price)}`;

  return {
    title: `${property.title} — ${copy.brand}`,
    description,
    openGraph: {
      title: property.title,
      description,
      images: [{ url: imageUrl, width: 1080, height: 1350 }],
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentSlug: string; propertyId: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { agentSlug, propertyId } = await params;
  const { ref } = await searchParams;

  const property = await getPropertyForPublicView(propertyId);
  if (!property) notFound();

  const agentProfile = (property as typeof property & {
    agent_profiles: {
      id: string;
      city: string | null;
      profiles: { username: string; full_name: string | null; phone: string | null; avatar_url: string | null } | null;
    } | null;
  }).agent_profiles;

  const supabase = await createClient();
  const imageUrls = [...property.property_images]
    .sort((a, b) => a.position - b.position)
    .map((img) => supabase.storage.from("property-photos").getPublicUrl(img.storage_path).data.publicUrl);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isUserRole = false;
  let isOwner = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isUserRole = profile?.role === "user";
    isOwner = profile?.role === "agent" && agentProfile?.id === user.id;
  }

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/agentes/${agentSlug}/propiedades/${propertyId}`;
  const agentPhone = agentProfile?.profiles?.phone;
  const agentName = agentProfile?.profiles?.full_name || agentProfile?.profiles?.username || "el agente";
  const isModelo = property.listing_kind === "modelo";
  const isProyectoEnPozo = property.listing_kind === "proyecto_en_pozo";
  const coverageCities = property.property_coverage_cities ?? [];
  const typologies = property.property_typologies ?? [];
  const referralRewardLabel =
    property.referral_reward_type === "fixed" && property.referral_reward_value != null
      ? new Intl.NumberFormat("es-PY", {
          style: "currency",
          currency: property.currency,
          maximumFractionDigits: 0,
        }).format(property.referral_reward_value)
      : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-3">
      <LeadTracker propertyId={propertyId} refCode={ref} />

      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2 lg:col-start-1 lg:row-start-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-semibold text-white">{property.title}</h1>
            <Badge
              tone={property.status === "available" ? "success" : "neutral"}
              className={
                property.status === "available" ? "border-emerald-200! bg-emerald-50! text-emerald-700!" : undefined
              }
            >
              {statusLabel[property.status]}
            </Badge>
          </div>
          {isModelo && (
            <Badge className="self-start border-transparent! bg-emerald-700! text-white!">
              Construimos en tu terreno
            </Badge>
          )}
          {isProyectoEnPozo && property.construction_stage !== "terminada" && (
            <Badge className="self-start border-transparent! bg-amber-100! text-amber-800!">
              {property.construction_stage === "en_pozo" ? "En pozo (preventa)" : "En construcción"}
            </Badge>
          )}
          <p className="flex items-center gap-1 text-sm text-slate-300">
            <MapPin size={14} />
            {isModelo
              ? `Cobertura: ${coverageCities.map((c) => c.city).join(", ") || "—"}`
              : `${property.address ? `${property.address}, ` : ""}${property.city}`}
          </p>
        </div>

        <PropertyGallery imageUrls={imageUrls} title={property.title} />
        <PropertyVideo url={property.youtube_url} />
        {isProyectoEnPozo && <TypologiesTable typologies={typologies} currency={property.currency} />}
      </div>

      <div className="flex min-w-0 flex-col gap-4 lg:col-start-3 lg:row-start-1 lg:row-span-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center shadow-sm sm:text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {isModelo ? "Cuota desde" : isProyectoEnPozo ? "Desde" : copy.property.price}
          </p>
          <p className="font-display text-2xl font-semibold text-prussian">
            {isModelo ? (
              <>
                {new Intl.NumberFormat("es-PY", {
                  style: "currency",
                  currency: property.currency,
                  maximumFractionDigits: 0,
                }).format(property.model_installment_from ?? 0)}
                <span className="text-sm font-normal text-slate-500"> /mes</span>
              </>
            ) : (
              <>
                {new Intl.NumberFormat("es-PY", { style: "currency", currency: property.currency }).format(
                  property.price
                )}
                {property.listing_type === "rent" && <span className="text-sm font-normal text-slate-500"> /mes</span>}
              </>
            )}
          </p>
          {isModelo && property.model_financing_type && (
            <p className="mt-1 text-xs font-medium text-emerald-700">
              Financiación{" "}
              {property.model_financing_type === "che_roga_pora"
                ? "Che Róga Porã"
                : property.model_financing_type === "bancaria"
                  ? "bancaria"
                  : "propia"}
            </p>
          )}

          {(property.bedrooms != null || property.bathrooms != null || property.area_m2 != null || property.garage) && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 sm:justify-start">
              {property.bedrooms != null && (
                <span className="flex items-center gap-1.5">
                  <BedDouble size={16} className="text-slate-400" />
                  {property.bedrooms} hab.
                </span>
              )}
              {property.bathrooms != null && (
                <span className="flex items-center gap-1.5">
                  <Bath size={16} className="text-slate-400" />
                  {property.bathrooms} baños
                </span>
              )}
              {property.area_m2 != null && (
                <span className="flex items-center gap-1.5">
                  <Ruler size={16} className="text-slate-400" />
                  {property.area_m2} m²
                </span>
              )}
              {property.garage && (
                <span className="flex items-center gap-1.5">
                  <Car size={16} className="text-slate-400" />
                  Garage
                </span>
              )}
            </div>
          )}

          <p className="mt-4 whitespace-pre-line break-words border-t border-slate-100 pt-4 text-sm text-slate-600">
            {property.description}
          </p>

          <div className="mt-4 flex flex-col items-center gap-2 border-t border-slate-100 pt-4">
            <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
              {agentProfile?.profiles?.avatar_url ? (
                <Image src={agentProfile.profiles.avatar_url} alt={agentName} fill className="object-cover" sizes="56px" />
              ) : (
                <User size={22} />
              )}
            </span>
            <p className="font-display text-sm font-medium text-prussian">{agentName}</p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {agentPhone && !isOwner && (
              <ChatWidget
                propertyId={propertyId}
                agentName={agentName}
                agentAvatarUrl={agentProfile?.profiles?.avatar_url ?? null}
                refCode={ref}
              />
            )}
            {isUserRole && <ShareButton propertyId={propertyId} propertyUrl={canonicalUrl} />}
            {isOwner && <AgentShareButton propertyId={propertyId} propertyUrl={canonicalUrl} />}
          </div>
        </div>

        {isModelo && referralRewardLabel && !isOwner && (
          <ModeloReferralCard
            propertyId={propertyId}
            propertyPath={canonicalUrl.replace(siteUrl, "")}
            rewardAmountLabel={referralRewardLabel}
            triggerLabel={property.commission_trigger_label}
          />
        )}
      </div>

      {property.lat != null && property.lng != null && (
        <div className="flex min-w-0 flex-col gap-2 lg:col-span-2 lg:col-start-1 lg:row-start-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            {copy.property.location}
          </h2>
          <PropertyMap lat={property.lat} lng={property.lng} />
        </div>
      )}
      </div>
    </div>
  );
}
