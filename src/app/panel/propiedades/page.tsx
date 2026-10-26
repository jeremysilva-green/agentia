import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Pencil, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAtPropertyLimit } from "@/lib/actions/properties";
import { NuevaPropiedadButton } from "@/components/panel/NuevaPropiedadButton";
import { MarketingVideoGenerator } from "@/components/panel/MarketingVideoGenerator";
import { LockedVideoButton } from "@/components/panel/LockedVideoButton";
import { getFundadorSeatsRemaining } from "@/lib/data/fundador";
import { getAgentContext } from "@/lib/data/panel";
import { listMarketingVideosForAgent } from "@/lib/data/marketingVideos";
import { isVideoStale } from "@/lib/marketing-video/isStale";
import { buildListingVideoCaption } from "@/lib/marketing-video/caption";
import { getPublicStorageUrl } from "@/lib/storage";
import { hasActiveProAccess } from "@/lib/plans";
import { AddToMlsModal } from "@/components/panel/mls/AddToMlsModal";
import { Reveal } from "@/components/panel/theme/Reveal";
import { SpotlightCard } from "@/components/panel/theme/SpotlightCard";
import { PanelBadge } from "@/components/panel/theme/PanelBadge";
import { EmptyState } from "@/components/panel/theme/EmptyState";

const statusLabel: Record<string, string> = {
  available: "Disponible",
  sold: "Vendida",
  rented: "Alquilada",
  draft: "Borrador",
};

const statusTone: Record<string, "emerald" | "red" | "amber" | "neutral"> = {
  available: "emerald",
  sold: "red",
  rented: "amber",
  draft: "neutral",
};

export default async function PropiedadesPage() {
  const supabase = await createClient();
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");
  const user = { id: ctx.userId };

  const eligibleForVideo = hasActiveProAccess(ctx.subscription);

  const [{ data: properties }, atLimit, videos, { data: mlsMembership }, { data: mlsListings }, fundadorSeatsRemaining] = await Promise.all([
    supabase
      .from("properties")
      .select("*, property_images(id, storage_path, position)")
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false }),
    isAtPropertyLimit(),
    eligibleForVideo ? listMarketingVideosForAgent(user.id) : Promise.resolve([]),
    supabase.from("mls_memberships").select("status").eq("user_id", user.id).maybeSingle(),
    supabase.from("mls_listings").select("property_id, status").eq("agent_id", user.id),
    getFundadorSeatsRemaining(),
  ]);

  const videoByPropertyId = new Map(videos.map((v) => [v.property_id, v]));
  const agentSlug = ctx.agentProfile?.slug ?? "";
  const isActiveMlsMember = mlsMembership?.status === "active";
  const activeMlsPropertyIds = new Set((mlsListings ?? []).filter((m) => m.status === "active").map((m) => m.property_id));
  const publishedCount = properties?.filter((p) => p.published).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
            <span className="panel-pulse-dot" />
            Tu portafolio
          </div>
          <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">Propiedades</h1>
        </div>
        <NuevaPropiedadButton atLimit={atLimit} fundadorSeatsRemaining={fundadorSeatsRemaining} />
      </div>

      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ink-2)] px-3 py-1.5 text-[13px] text-[#cfcfcf]">
        <b className="font-display text-[var(--em-2)]">{publishedCount}</b>
        {publishedCount === 1 ? "propiedad publicada" : "propiedades publicadas"}
      </div>

      {(!properties || properties.length === 0) && (
        <EmptyState message="Todavía no cargaste propiedades. Creá la primera para empezar a recibir leads." />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties?.map((property, i) => {
          const cover = [...property.property_images].sort((a, b) => a.position - b.position)[0];
          const coverUrl = cover
            ? supabase.storage.from("property-photos").getPublicUrl(cover.storage_path).data.publicUrl
            : null;

          return (
            <Reveal key={property.id} delay={(((i % 4) + 1) as 1 | 2 | 3 | 4)}>
              <SpotlightCard className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--ink-2)] transition-transform duration-500 hover:-translate-y-1.5 hover:border-[#0a8f5c88]">
                <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={property.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.07]"
                      sizes="360px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">Sin foto</div>
                  )}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundImage: "linear-gradient(180deg, transparent 45%, #0E0E0Ecc)" }}
                  />
                  <span className="absolute top-3 left-3 z-10">
                    <PanelBadge tone={statusTone[property.status]}>{statusLabel[property.status]}</PanelBadge>
                  </span>
                  <span className="absolute bottom-3 left-3.5 z-10 font-display text-2xl font-semibold text-white [text-shadow:0_2px_12px_#0008]">
                    {new Intl.NumberFormat("es-PY", { style: "currency", currency: property.currency, maximumFractionDigits: 0 }).format(
                      property.price
                    )}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="truncate font-display text-[17px] font-semibold text-white">{property.title}</h2>
                  <p className="flex items-center gap-1.5 text-[13.5px] text-[var(--muted)]">
                    <MapPin size={14} className="text-[var(--em-2)]" />
                    {property.city}
                    <span className="h-[3px] w-[3px] rounded-full bg-[#555]" />
                    {property.listing_type === "rent" ? "Alquiler" : "Venta"}
                  </p>
                  {!property.published && <PanelBadge tone="amber">Sin publicar</PanelBadge>}

                  <div className="mt-auto flex flex-col gap-2 border-t border-white/[0.06] pt-3.5">
                    <Link
                      href={`/panel/propiedades/${property.id}/editar`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[var(--em)] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--em-2)]"
                    >
                      <Pencil size={14} />
                      Editar
                    </Link>

                    {isActiveMlsMember && property.listing_kind !== "modelo" && !activeMlsPropertyIds.has(property.id) && (
                      <AddToMlsModal propertyId={property.id} propertyAddress={property.address} propertyCurrency={property.currency} />
                    )}

                    {!eligibleForVideo && property.listing_kind === "standard" && property.property_images.length > 0 && (
                      <LockedVideoButton fundadorSeatsRemaining={fundadorSeatsRemaining} />
                    )}

                    {eligibleForVideo &&
                      property.listing_kind === "standard" &&
                      property.property_images.length > 0 &&
                      (() => {
                        const video = videoByPropertyId.get(property.id);
                        const imageUrls = [...property.property_images]
                          .sort((a, b) => a.position - b.position)
                          .map((img) => getPublicStorageUrl("property-photos", img.storage_path));

                        return (
                          <MarketingVideoGenerator
                            propertyId={property.id}
                            agentId={user.id}
                            listing={{
                              title: property.title,
                              price: property.price,
                              currency: property.currency,
                              listingType: property.listing_type,
                              city: property.city,
                              address: property.address,
                            }}
                            imageUrls={imageUrls}
                            caption={buildListingVideoCaption(property, agentSlug, property.id)}
                            hasExistingVideo={Boolean(video)}
                            isStale={video ? isVideoStale(video, property) : false}
                          />
                        );
                      })()}
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          );
        })}

        <Reveal delay={(((properties?.length ?? 0) % 4) + 1) as 1 | 2 | 3 | 4}>
          <NuevaPropiedadButton atLimit={atLimit} variant="tile" fundadorSeatsRemaining={fundadorSeatsRemaining} />
        </Reveal>
      </div>
    </div>
  );
}
