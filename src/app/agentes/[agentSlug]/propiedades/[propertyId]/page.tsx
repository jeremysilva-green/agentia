import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPropertyForPublicView } from "@/lib/data/agentPortfolio";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertyVideo } from "@/components/property/PropertyVideo";
import { PropertyMap } from "@/components/property/PropertyMap";
import { ChatWidget } from "@/components/property/ChatWidget";
import { AgendarModal } from "@/components/property/AgendarModal";
import { ShareButton } from "@/components/property/ShareButton";
import { AgentShareButton } from "@/components/property/AgentShareButton";
import { PublicShareButton } from "@/components/property/PublicShareButton";
import { LeadTracker } from "@/components/property/LeadTracker";
import { TypologiesTable } from "@/components/property/TypologiesTable";
import { ModeloReferralCard } from "@/components/property/ModeloReferralCard";
import { ReferralTeaserCard } from "@/components/property/ReferralTeaserCard";
import { FactsGrid } from "@/components/property/FactsGrid";
import { ReadMoreText } from "@/components/property/ReadMoreText";
import { MobileStickyBar } from "@/components/property/MobileStickyBar";
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

  // Computed once, reused by both the price card and the mobile sticky bar.
  const priceFormatted = isModelo
    ? new Intl.NumberFormat("es-PY", {
        style: "currency",
        currency: property.currency,
        maximumFractionDigits: 0,
      }).format(property.model_installment_from ?? 0)
    : new Intl.NumberFormat("es-PY", { style: "currency", currency: property.currency }).format(property.price);
  const priceSuffix = isModelo || property.listing_type === "rent" ? "/mes" : "";
  const priceLabelPlain = priceSuffix ? `${priceFormatted} ${priceSuffix}` : priceFormatted;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0e0e0e]">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.05)" spotColor="rgb(255 255 255 / 0)" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-3">
        <LeadTracker propertyId={propertyId} refCode={ref} />

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-2xl font-semibold text-white">{property.title}</h1>
              <Badge
                tone={property.status === "available" ? "success" : "neutral"}
                className={
                  property.status === "available"
                    ? "border-emerald-500/30! bg-emerald-500/10! text-emerald-400!"
                    : "border-white/10! bg-white/5! text-white/60!"
                }
              >
                {property.status === "available" && (
                  <span className="relative mr-1.5 flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                )}
                {statusLabel[property.status]}
              </Badge>
            </div>
            {isModelo && (
              <Badge className="self-start border-transparent! bg-emerald-700! text-white!">
                Construimos en tu terreno
              </Badge>
            )}
            {isProyectoEnPozo && property.construction_stage !== "terminada" && (
              <Badge className="self-start border-transparent! bg-amber-500/15! text-amber-300!">
                {property.construction_stage === "en_pozo" ? "En pozo (preventa)" : "En construcción"}
              </Badge>
            )}
            <p className="flex items-center gap-1.5 text-sm text-white/50">
              <MapPin size={14} className="text-emerald-400" />
              {isModelo
                ? `Cobertura: ${coverageCities.map((c) => c.city).join(", ") || "—"}`
                : `${property.address ? `${property.address}, ` : ""}${property.city}`}
            </p>
          </div>

          <PropertyGallery imageUrls={imageUrls} title={property.title} />
          <PropertyVideo url={property.youtube_url} />

          <FactsGrid
            areaM2={property.area_m2}
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            garage={property.garage}
            propertyType={property.property_type}
          />

          {property.description && <ReadMoreText text={property.description} />}

          {isProyectoEnPozo && <TypologiesTable typologies={typologies} currency={property.currency} />}
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 lg:self-start">
          <div
            id="priceCard"
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-emerald-600/20 blur-3xl"
            />
            <div className="relative">
              <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">
                {isModelo ? "Cuota desde" : isProyectoEnPozo ? "Desde" : copy.property.price}
              </p>
              <p className="font-display mt-1 text-3xl font-semibold text-white">
                {priceFormatted}
                {priceSuffix && <span className="text-base font-normal text-white/40"> {priceSuffix}</span>}
              </p>
              {isModelo && property.model_financing_type && (
                <p className="mt-1.5 text-xs font-medium text-emerald-400">
                  Financiación{" "}
                  {property.model_financing_type === "che_roga_pora"
                    ? "Che Róga Porã"
                    : property.model_financing_type === "bancaria"
                      ? "bancaria"
                      : "propia"}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 text-white">
                  {agentProfile?.profiles?.avatar_url ? (
                    <Image
                      src={agentProfile.profiles.avatar_url}
                      alt={agentName}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <User size={20} />
                  )}
                  <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-neutral-900 bg-emerald-400" />
                </span>
                <p className="font-display text-sm font-medium text-white">{agentName}</p>
              </div>

              <div className="mt-4 flex flex-col gap-2.5">
                {agentPhone && !isOwner && (
                  <ChatWidget
                    propertyId={propertyId}
                    agentName={agentName}
                    agentAvatarUrl={agentProfile?.profiles?.avatar_url ?? null}
                    refCode={ref}
                  />
                )}
                {!isOwner && <AgendarModal propertyId={propertyId} refCode={ref} />}
                {isUserRole && <ShareButton propertyId={propertyId} propertyUrl={canonicalUrl} />}
                {isOwner && <AgentShareButton propertyId={propertyId} propertyUrl={canonicalUrl} />}
                {!isOwner && !isUserRole && <PublicShareButton title={property.title} url={canonicalUrl} />}
              </div>
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
          {!isModelo && !isOwner && (
            <ReferralTeaserCard propertyId={propertyId} propertyPath={canonicalUrl.replace(siteUrl, "")} />
          )}
        </div>

        {property.lat != null && property.lng != null && (
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-2 lg:col-start-1 lg:row-start-2">
            <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">{copy.property.location}</h2>
            <PropertyMap
              lat={property.lat}
              lng={property.lng}
              label={isModelo ? undefined : `${property.address ? `${property.address}, ` : ""}${property.city}`}
            />
          </div>
        )}
      </div>

      <MobileStickyBar priceLabel={priceLabelPlain} targetId="priceCard" />
    </div>
  );
}
