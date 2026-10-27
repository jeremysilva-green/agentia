import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { MarketplaceSearchPanel } from "@/components/marketplace/MarketplaceSearchPanel";
import { PropertyGrid } from "@/components/marketplace/PropertyGrid";
import { PropertyCard } from "@/components/property/PropertyCard";
import { getAgentBySlug, getAgentProperties, getAgentRatingSummary } from "@/lib/data/agentPortfolio";
import { getMilestone } from "@/lib/ratings";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/locale";
import { AvatarUploader } from "@/components/panel/AvatarUploader";
import { AgentProfileAvatar } from "@/components/property/AgentProfileAvatar";
import { ClientRequestTabs } from "@/components/marketplace/ClientRequestTabs";
import { CreateCatalogButton } from "@/components/property/CreateCatalogButton";
import { RateAgentWidget } from "@/components/property/RateAgentWidget";
import { PortfolioTracker } from "@/components/property/PortfolioTracker";
import { parsePropertyTypeParam } from "@/lib/constants/propertyTypes";
import "../marketplace-theme.css";

export default async function AgentPortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentSlug: string }>;
  searchParams: Promise<{
    city?: string;
    listingType?: string;
    propertyType?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    q?: string;
  }>;
}) {
  const { agentSlug } = await params;
  const filters = await searchParams;
  const { locale } = await getDictionary();

  const agent = await getAgentBySlug(agentSlug);
  if (!agent) notFound();

  const profile = (agent as typeof agent & {
    profiles: { username: string; full_name: string | null; avatar_url: string | null } | null;
  }).profiles;

  const [properties, ratingSummary] = await Promise.all([
    getAgentProperties(agent.id, {
      city: filters.city || undefined,
      listingType: filters.listingType === "sale" ? "sale" : undefined,
      propertyType: parsePropertyTypeParam(filters.propertyType),
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      q: filters.q,
    }),
    getAgentRatingSummary(agent.id),
  ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === agent.id;
  let isUserRole = false;
  if (user && !isOwner) {
    const { data: viewerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isUserRole = viewerProfile?.role === "user";
  }

  const availableCount = properties.filter((p) => p.status === "available").length;
  const soldCount = properties.filter((p) => p.status === "sold").length;
  const displayName = profile?.full_name || profile?.username || "Agente";
  const milestone = getMilestone(ratingSummary.avg, ratingSummary.count);

  const propertyCards = properties.map((property) => (
    <PropertyCard
      key={property.id}
      property={property}
      agentSlug={agentSlug}
      isOwner={isOwner}
      agentName={displayName}
      agentAvatarUrl={profile?.avatar_url}
      dark
    />
  ));

  return (
    <div className="market-dark relative flex min-h-screen flex-col overflow-x-hidden">
      <PortfolioTracker agentId={agent.id} />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="market-glow" />

        <div className="relative z-10 flex items-center gap-3">
          {isOwner ? (
            <AvatarUploader userId={agent.id} initialAvatarUrl={profile?.avatar_url ?? null} variant="compact" displayName={displayName} />
          ) : (
            <AgentProfileAvatar avatarUrl={profile?.avatar_url ?? null} logoUrl={agent.logo_url} displayName={displayName} />
          )}
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="font-display text-lg font-semibold leading-tight text-white">{displayName}</h1>
            {agent.city && (
              <p className="flex items-center gap-1 text-xs text-[var(--muted)]">
                <MapPin size={12} className="text-[var(--em-2)]" />
                {agent.city}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center rounded-full border border-[#13c47f55] bg-[#13c47f17] px-3 py-1 text-xs font-bold text-[var(--em-2)]">
                {availableCount} disponibles
              </span>
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold text-[#bdbdbd]">
                {soldCount} vendidas
              </span>
              {milestone && (
                <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
                  {milestone.label}
                </span>
              )}
            </div>
            {!isOwner && <RateAgentWidget agentId={agent.id} agentSlug={agentSlug} myRating={ratingSummary.myRating} />}
          </div>

          {agent.logo_url && (
            <div className="ml-auto hidden shrink-0 flex-col items-center gap-1.5 sm:flex">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <Image src={agent.logo_url} alt={agent.brand_name ?? "Logo del agente"} fill className="object-contain" sizes="56px" />
              </div>
              {agent.brand_name && (
                <p className="font-display text-center text-sm font-semibold text-white">{agent.brand_name}</p>
              )}
            </div>
          )}
        </div>

        {agent.bio && <p className="relative z-10 max-w-3xl text-[var(--muted)]">{agent.bio}</p>}

        {!isOwner && (
          <div className="relative z-10 flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-end">
            {isUserRole && <CreateCatalogButton agentId={agent.id} agentSlug={agentSlug} />}
            <ClientRequestTabs agentId={agent.id} />
          </div>
        )}

        {/* z-30 for the same reason as the main marketplace page: this is its
            own stacking context, and needs to paint above the property grid
            below (a later z-10 sibling) so the dropdown popups aren't
            clipped underneath it. */}
        <div className="relative z-30">
          <MarketplaceSearchPanel locale={locale} placeholder="Buscá por título, ciudad o palabra clave..." />
        </div>

        <div className="relative z-10">
          <PropertyGrid
            cards={propertyCards}
            emptyMessage="Este agente todavía no tiene propiedades publicadas con esos filtros."
          />
        </div>
      </div>
    </div>
  );
}
