import { getMarketplaceAgents } from "@/lib/data/marketplace";
import { AgentGrid } from "@/components/marketplace/AgentGrid";
import { FilterBar } from "@/components/marketplace/FilterBar";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { BackToTopButton } from "@/components/BackToTopButton";
import { HeroHeadline } from "@/components/marketplace/HeroHeadline";
import { getDictionary } from "@/lib/i18n/locale";
import { parsePropertyTypeParam } from "@/lib/constants/propertyTypes";

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
  }>;
}) {
  const params = await searchParams;
  const { dict, locale } = await getDictionary();

  const agents = await getMarketplaceAgents({
    city: params.city,
    listingType: params.listingType === "rent" || params.listingType === "sale" ? params.listingType : undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    propertyType: parsePropertyTypeParam(params.propertyType),
    q: params.q,
  });

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />

      <section className="relative overflow-hidden border-b border-slate-200 bg-white px-4 py-16 sm:px-6 sm:py-24">
        <InteractiveBackground />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 text-center sm:text-left">
          <HeroHeadline fallback={dict.home.title} animated={locale === "es"} />
        </div>
      </section>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="sticky top-0 z-40 flex flex-col gap-2 bg-neutral-900 py-3">
          <div className="relative z-30 animate-fade-in-up" style={{ animationDelay: "450ms" }}>
            <SearchBar />
          </div>

          <div className="relative z-20 animate-fade-in-up" style={{ animationDelay: "550ms" }}>
            <FilterBar dict={dict.home.filters} locale={locale} />
          </div>
        </div>

        <div className="relative z-10 animate-fade-in-up" style={{ animationDelay: "650ms" }}>
          <AgentGrid key={JSON.stringify(params)} agents={agents} dict={dict.home.agentCard} emptyMessage={dict.home.empty} />
        </div>
      </div>

      <BackToTopButton />
    </div>
  );
}
