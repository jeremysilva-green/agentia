import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GenerateLinkButton } from "@/components/property/GenerateLinkButton";
import { AgentShareButton } from "@/components/property/AgentShareButton";
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

export async function PropertyCard({
  property,
  agentSlug,
  isOwner = false,
}: {
  property: PropertyWithImages;
  agentSlug: string;
  isOwner?: boolean;
}) {
  const supabase = await createClient();
  const cover = [...property.property_images].sort((a, b) => a.position - b.position)[0];
  const coverUrl = cover
    ? supabase.storage.from("property-photos").getPublicUrl(cover.storage_path).data.publicUrl
    : null;

  const propertyPath = `/agentes/${agentSlug}/propiedades/${property.id}`;
  const isModelo = property.listing_kind === "modelo";
  const coverageCities = property.property_coverage_cities ?? [];

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-emerald-500! hover:border-emerald-600!">
      <Link href={propertyPath}>
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              sizes="360px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">Sin foto</div>
          )}
          <Badge
            tone={statusTone[property.status]}
            className={cn(
              "absolute left-3 top-3",
              property.status === "available" && "border-transparent! bg-emerald-600! text-white!",
              property.status === "sold" && "border-transparent! bg-red-600! text-white!"
            )}
          >
            {statusLabel[property.status]}
          </Badge>
          {isModelo && (
            <Badge className="absolute right-3 top-3 border-transparent! bg-blue-600! text-white!">
              Construimos en tu terreno
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col bg-emerald-50">
        <Link href={propertyPath} className="flex-1 p-4 pb-3">
          <h3 className="truncate font-display text-sm font-semibold text-prussian">{property.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
            <MapPin size={12} />
            {isModelo && coverageCities.length > 0
              ? `Cobertura: ${getCoverageSummaryLabel(coverageCities.map((c) => c.city))}`
              : property.city}
          </p>
        </Link>

        <div className="flex items-center justify-between gap-2 border-t border-emerald-100 px-4 py-3">
          <p className="text-sm font-semibold text-prussian">
            {isModelo ? (
              <>
                Cuota desde{" "}
                {new Intl.NumberFormat("es-PY", {
                  style: "currency",
                  currency: property.currency,
                  maximumFractionDigits: 0,
                }).format(property.model_installment_from ?? 0)}
                <span className="block text-xs font-normal text-slate-600">/mes</span>
              </>
            ) : (
              <>
                {new Intl.NumberFormat("es-PY", { style: "currency", currency: property.currency }).format(
                  property.price
                )}
                {property.listing_type === "rent" && (
                  <span className="block text-xs font-normal text-slate-600">/mes</span>
                )}
              </>
            )}
          </p>
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
