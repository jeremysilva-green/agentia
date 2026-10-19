import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAgentContext } from "@/lib/data/panel";
import { getMlsMembershipStatus } from "@/lib/actions/mlsMembership";
import { listActiveMlsListings } from "@/lib/data/mlsListings";
import { MlsListingCard } from "@/components/property/MlsListingCard";
import { PropertyFilterBar } from "@/components/marketplace/PropertyFilterBar";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { parsePropertyTypeParam } from "@/lib/constants/propertyTypes";
import { Reveal } from "@/components/panel/theme/Reveal";
import { EmptyState } from "@/components/panel/theme/EmptyState";

export default async function MlsPropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; propertyType?: string | string[]; minPrice?: string; maxPrice?: string; q?: string }>;
}) {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const { membership } = await getMlsMembershipStatus(ctx.userId);
  if (membership?.status !== "active") redirect("/panel/mls");

  const filters = await searchParams;
  const listings = await listActiveMlsListings({
    city: filters.city || undefined,
    propertyType: parsePropertyTypeParam(filters.propertyType),
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    q: filters.q,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/panel/mls" className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--muted)] hover:text-white">
          <ArrowLeft size={14} />
          MLS
        </Link>
        <h1 className="mt-1 font-display text-[clamp(26px,4vw,36px)] font-semibold text-white">Propiedades del MLS</h1>
        <p className="text-sm text-[var(--muted)]">
          Propiedades activas cargadas por otros miembros del MLS, con su oferta de cooperación.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <SearchBar placeholder="Buscá por título, ciudad o palabra clave..." />
        <PropertyFilterBar />
      </div>

      {listings.length === 0 ? (
        <EmptyState message="Todavía no hay propiedades en el MLS con esos filtros." />
      ) : (
        <Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <MlsListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
