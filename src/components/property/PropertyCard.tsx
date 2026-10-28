import { resolveListingCommission } from "@/lib/constants/commission";
import Link from "next/link";
import Image from "next/image";
import { MapPin, User, BedDouble, Bath, Ruler } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GenerateLinkButton } from "@/components/property/GenerateLinkButton";
import { AgentShareButton } from "@/components/property/AgentShareButton";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { getSiteUrl } from "@/lib/siteUrl";
import { getCoverageSummaryLabel } from "@/lib/constants/coverageCities";
import type { PropertyWithImages } from "@/types/domain";

const statusTone = {
  available: "success",
  sold: "neutral",
  rented: "warning",
  draft: "neutral",
} as const;

const statusLabel = {
  available: copy.property.available,
  sold: copy.property.sold,
  rented: copy.property.rented,
  draft: "Borrador",
};

function formatCommissionBadge(property: PropertyWithImages): string | undefined {
  if (property.referral_reward_type === "commission_share") {
    const { affiliatePctOfPrice } = resolveListingCommission(property, property.price);
    return `${affiliatePctOfPrice.toLocaleString("es-PY", { maximumFractionDigits: 2 })}%`;
  }
  if (property.referral_reward_type === "percentage" && property.referral_reward_value != null) {
    return `${property.referral_reward_value}%`;
  }
  if (property.referral_reward_type === "fixed" && property.referral_reward_value != null) {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: property.currency,
      maximumFractionDigits: 0,
    }).format(property.referral_reward_value);
  }
  return undefined;
}

export async function PropertyCard({
  property,
  agentSlug,
  isOwner = false,
  agentName,
  agentAvatarUrl,
  dark = false,
}: {
  property: PropertyWithImages;
  agentSlug: string;
  isOwner?: boolean;
  // Only set by the cross-agent marketplace grid (src/components/marketplace/PropertyGrid.tsx) —
  // identifies the listing agent since, unlike a single agent's own
  // portfolio page, that's not implied by context there. Existing callers
  // that don't pass it render exactly as before.
  agentName?: string;
  agentAvatarUrl?: string | null;
  // Only an additive variant — existing callers (the single-agent portfolio
  // page) that don't pass it render byte-identical to before.
  dark?: boolean;
}) {
  const supabase = await createClient();
  const cover = [...property.property_images].sort((a, b) => a.position - b.position)[0];
  const coverUrl = cover
    ? supabase.storage.from("property-photos").getPublicUrl(cover.storage_path).data.publicUrl
    : null;

  const propertyPath = `/agentes/${agentSlug}/propiedades/${property.id}`;
  const isModelo = property.listing_kind === "modelo";
  const coverageCities = property.property_coverage_cities ?? [];
  const locationLabel =
    isModelo && coverageCities.length > 0
      ? `Cobertura: ${getCoverageSummaryLabel(coverageCities.map((c) => c.city))}`
      : property.city;

  const priceNode = isModelo ? (
    <>
      Cuota desde{" "}
      {new Intl.NumberFormat("es-PY", {
        style: "currency",
        currency: property.currency,
        maximumFractionDigits: 0,
      }).format(property.model_installment_from ?? 0)}
      {dark ? "" : <span className="block text-xs font-normal text-slate-500">/mes</span>}
    </>
  ) : (
    <>
      {new Intl.NumberFormat("es-PY", { style: "currency", currency: property.currency }).format(property.price)}
    </>
  );

  const factsNode = (property.bedrooms != null || property.bathrooms != null || property.area_m2 != null) && (
    <p className={cn("flex items-center gap-3 text-xs", dark ? "text-[var(--muted)]" : "mt-1.5 text-slate-500")}>
      {property.bedrooms != null && (
        <span className="flex items-center gap-1">
          <BedDouble size={13} />
          {property.bedrooms}
        </span>
      )}
      {property.bathrooms != null && (
        <span className="flex items-center gap-1">
          <Bath size={13} />
          {property.bathrooms}
        </span>
      )}
      {property.area_m2 != null && (
        <span className="flex items-center gap-1">
          <Ruler size={13} />
          {property.area_m2} m²
        </span>
      )}
    </p>
  );

  if (dark) {
    const commissionBadge = formatCommissionBadge(property);
    return (
      <div className="group market-rv relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--ink-2)] transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-2 hover:border-[#0a8f5c99] hover:shadow-[0_30px_60px_-30px_#000,0_0_0_1px_#0a8f5c33]">
        <Link href={propertyPath} className="relative block aspect-[16/11] overflow-hidden bg-black/40">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="360px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">Sin foto</div>
          )}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "linear-gradient(180deg, #0006 0%, transparent 28%, transparent 50%, var(--ink-2) 100%)" }}
          />

          <span
            className={cn(
              "absolute top-2 left-2 z-10 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm",
              property.status === "available"
                ? "border-[#13c47f55] bg-[#0e0e0ecc] text-[var(--em-2)]"
                : "border-white/15 bg-[#0e0e0ecc] text-[#bdbdbd]"
            )}
          >
            {property.status === "available" && <span className="market-pulse-dot" />}
            {statusLabel[property.status]}
          </span>

          {isModelo && (
            <span className="absolute top-2 right-11 z-10 inline-flex items-center rounded-full border border-blue-400/40 bg-[#0e0e0ecc] px-2.5 py-1 text-[11px] font-bold text-blue-300 backdrop-blur-sm">
              Construimos en tu terreno
            </span>
          )}

          <span className="absolute left-4 bottom-3 z-10 flex items-baseline gap-1.5 [text-shadow:0_2px_14px_#000a]">
            <span className="font-display text-[26px] leading-none font-semibold text-white">{priceNode}</span>
          </span>
        </Link>

        <FavoriteButton propertyId={property.id} />

        <div className="flex flex-1 flex-col gap-1 p-4">
          <Link href={propertyPath}>
            <h3 className="line-clamp-2 min-h-[2.5em] text-[18px] leading-tight font-semibold text-white">{property.title}</h3>
          </Link>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-[var(--muted)]">
            <MapPin size={14} className="shrink-0 text-[var(--em-2)]" />
            {locationLabel}
          </p>
          {factsNode}

          <div className="mt-auto flex items-center gap-2.5 border-t border-white/[0.06] pt-3.5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="relative grid h-[30px] w-[30px] shrink-0 place-items-center overflow-hidden rounded-full border border-white/[0.1] bg-gradient-to-br from-[#1d2a24] to-[#2a2a2a] text-[11px] font-bold text-[#cfcfcf]">
                {agentAvatarUrl ? (
                  <Image src={agentAvatarUrl} alt="" fill className="object-cover" sizes="30px" />
                ) : agentName ? (
                  agentName
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                ) : (
                  <User size={14} />
                )}
              </span>
              {agentName && <span className="truncate text-[13px] text-[#cfcfcf]">{agentName}</span>}
            </div>
            {isOwner ? (
              <AgentShareButton propertyId={property.id} propertyUrl={`${getSiteUrl()}${propertyPath}`} compact />
            ) : (
              <GenerateLinkButton propertyId={property.id} propertyPath={propertyPath} badge={commissionBadge} dark />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="group flex h-full flex-col gap-0 overflow-hidden border-slate-100! bg-white! p-0 hover:border-slate-200!">
      <Link href={propertyPath} className="block">
        <div className="relative aspect-[1.27/1] overflow-hidden bg-slate-100">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="360px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">Sin foto</div>
          )}
          <Badge
            tone={statusTone[property.status]}
            className={cn(
              "absolute left-3 top-3 shadow-sm",
              property.status === "available" && "border-transparent! bg-emerald-600! text-white!",
              property.status === "sold" && "border-transparent! bg-red-600! text-white!"
            )}
          >
            {statusLabel[property.status]}
          </Badge>
          {isModelo && (
            <Badge className="absolute right-3 top-3 border-transparent! bg-blue-600! text-white! shadow-sm">
              Construimos en tu terreno
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col">
        <Link href={propertyPath} className="flex-1 px-4 pt-3.5 pb-2.5">
          <h3 className="truncate font-display text-base font-semibold text-prussian">{property.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={12} />
            {locationLabel}
          </p>
          {agentName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <User size={12} />
              {agentName}
            </p>
          )}
          {factsNode}
        </Link>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-prussian">{priceNode}</p>
          {isOwner ? (
            <AgentShareButton propertyId={property.id} propertyUrl={`${getSiteUrl()}${propertyPath}`} compact />
          ) : (
            <GenerateLinkButton propertyId={property.id} propertyPath={propertyPath} />
          )}
        </div>
      </div>
    </Card>
  );
}
