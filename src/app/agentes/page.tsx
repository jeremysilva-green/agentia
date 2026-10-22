import type { Metadata } from "next";
import { getMarketplaceAgents, getMarketplaceProperties } from "@/lib/data/marketplace";
import { AgentGrid } from "@/components/marketplace/AgentGrid";
import { PropertyGrid } from "@/components/marketplace/PropertyGrid";
import { ListingKindToggle } from "@/components/marketplace/ListingKindToggle";
import { MarketplaceSearchPanel } from "@/components/marketplace/MarketplaceSearchPanel";
import { BackToTopButton } from "@/components/BackToTopButton";
import { HeroHeadline } from "@/components/marketplace/HeroHeadline";
import { PropertyCard } from "@/components/property/PropertyCard";
import { getDictionary } from "@/lib/i18n/locale";
import { parsePropertyTypeParam } from "@/lib/constants/propertyTypes";
import { copy } from "@/lib/copy";
import "./marketplace-theme.css";

// This page used to live at "/" (and inherit the root layout's metadata,
// which was this same marketplace copy). Now that "/" is the landing page,
// this route needs its own metadata instead of falling back to the root's.
export const metadata: Metadata = {
  title: `${copy.home.title} | ${copy.brand}`,
  description: copy.home.subtitle,
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string;
    listingType?: string;
    minPrice?: string;
    maxPrice?: string;
    propertyType?: string | string[];
    q?: string;
    view?: string;
  }>;
}) {
  const params = await searchParams;
  const { dict, locale } = await getDictionary();

  const view = params.view === "propiedades" ? "propiedades" : "agentes";

  const filters = {
    city: params.city,
    listingType: params.listingType === "rent" || params.listingType === "sale" ? params.listingType : undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    propertyType: parsePropertyTypeParam(params.propertyType),
    q: params.q,
  } as const;

  // Fetched both regardless of which tab is active, so the toggle's own
  // count badges are always accurate instead of showing 0 for whichever
  // view isn't currently selected.
  const [agents, properties] = await Promise.all([getMarketplaceAgents(filters), getMarketplaceProperties(filters)]);

  const propertyCards = properties.map((property) => {
    const agentProfile = property.agent_profiles?.profiles;
    const agentName = agentProfile?.full_name || agentProfile?.username || "";
    return (
      <PropertyCard
        key={property.id}
        property={property}
        agentSlug={property.agent_profiles?.slug ?? ""}
        agentName={agentName}
        agentAvatarUrl={agentProfile?.avatar_url}
        dark
      />
    );
  });

  return (
    <div className="market-dark relative flex min-h-screen flex-col overflow-x-hidden">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="market-glow" />

        <div className="relative z-10 flex flex-col gap-4 text-center sm:text-left">
          <HeroHeadline fallback={dict.home.title} animated={locale === "es"} dark />
        </div>

        {/* z-30, above the toggle/grid sections below (both z-10): those are
            later siblings that'd otherwise paint over this panel's own
            dropdown popups, since each "relative z-*" div here is its own
            stacking context — a descendant's z-20 only ranks within its own
            parent context, not against sibling contexts. */}
        <div className="relative z-30">
          <MarketplaceSearchPanel locale={locale} />
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
          <ListingKindToggle
            current={view}
            labels={dict.home.tabs}
            counts={{ agents: agents.length, properties: properties.length }}
          />
        </div>

        <div className="market-vin relative z-10" key={view}>
          {view === "agentes" ? (
            <AgentGrid key={JSON.stringify(params)} agents={agents} dict={dict.home.agentCard} emptyMessage={dict.home.empty} />
          ) : (
            <PropertyGrid key={JSON.stringify(params)} cards={propertyCards} emptyMessage={dict.home.propertiesEmpty} />
          )}
        </div>
      </div>

      <BackToTopButton />
    </div>
  );
}
