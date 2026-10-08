import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getAgentProperties } from "@/lib/data/agentPortfolio";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { AgentProfileAvatar } from "@/components/property/AgentProfileAvatar";
import { getPublicStorageUrl } from "@/lib/storage";
import { copy } from "@/lib/copy";

async function getCatalog(code: string) {
  const service = createServiceClient();
  const { data: catalog } = await service
    .from("affiliate_catalogs")
    .select("user_id, agent_id, click_count, profiles!affiliate_catalogs_user_id_fkey(username)")
    .eq("code", code)
    .maybeSingle();

  if (!catalog) return null;

  const { data: agentProfile } = await service
    .from("agent_profiles")
    .select("slug, brand_name, logo_url, profiles(full_name, username)")
    .eq("id", catalog.agent_id)
    .eq("is_active", true)
    .maybeSingle();

  return {
    userId: catalog.user_id,
    agentId: catalog.agent_id,
    clickCount: catalog.click_count,
    affiliateUsername: catalog.profiles?.username ?? null,
    agentProfile,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const catalog = await getCatalog(code);
  if (!catalog?.agentProfile) return {};

  const agentDisplayName =
    catalog.agentProfile.brand_name || catalog.agentProfile.profiles?.full_name || catalog.agentProfile.profiles?.username || "Agente";
  const title = `${copy.catalog.pageTitlePrefix} ${agentDisplayName} — ${copy.brand}`;

  return {
    title,
    openGraph: { title },
    twitter: { card: "summary", title },
  };
}

export default async function CatalogPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const catalog = await getCatalog(code);
  if (!catalog?.agentProfile || !catalog.affiliateUsername) notFound();

  const { agentProfile, affiliateUsername, agentId, clickCount } = catalog;

  const service = createServiceClient();
  service.from("affiliate_catalogs").update({ click_count: clickCount + 1 }).eq("code", code).then(() => {});

  const properties = await getAgentProperties(agentId, {});

  if (properties.length > 0) {
    await service
      .from("affiliate_links")
      .upsert(
        properties.map((property) => ({ property_id: property.id, user_id: catalog.userId })),
        { onConflict: "property_id,user_id", ignoreDuplicates: true }
      );
  }

  const agentDisplayName = agentProfile.brand_name || agentProfile.profiles?.full_name || agentProfile.profiles?.username || "Agente";

  return (
    <div className="relative min-h-screen bg-neutral-900">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <AgentProfileAvatar avatarUrl={null} logoUrl={agentProfile.logo_url} displayName={agentDisplayName} />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-display text-lg font-semibold leading-tight text-white">
              {copy.catalog.pageTitlePrefix} {agentDisplayName}
            </h1>
            <p className="text-xs text-white/60">{copy.catalog.propertiesCount(properties.length)}</p>
          </div>
        </div>

        {properties.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-sm text-white/50">
            {copy.catalog.empty}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              const imageUrls = [...property.property_images]
                .sort((a, b) => a.position - b.position)
                .map((img) => getPublicStorageUrl("property-photos", img.storage_path));
              const price = new Intl.NumberFormat("es-PY", { style: "currency", currency: property.currency }).format(property.price);

              return (
                <div key={property.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <PropertyGallery imageUrls={imageUrls} title={property.title} />
                  <div className="flex flex-col gap-1 px-1">
                    <h2 className="font-display text-sm font-semibold leading-tight text-white">{property.title}</h2>
                    <p className="text-base font-semibold text-emerald-400">{price}</p>
                  </div>
                  <a
                    href={`/agentes/${agentProfile.slug}/propiedades/${property.id}?ref=${encodeURIComponent(affiliateUsername)}`}
                    className="mx-1 mt-1 rounded-lg bg-emerald-600 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    {copy.catalog.viewProperty}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
