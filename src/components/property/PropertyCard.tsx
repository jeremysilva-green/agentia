import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GenerateLinkButton } from "@/components/property/GenerateLinkButton";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
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
}: {
  property: PropertyWithImages;
  agentSlug: string;
}) {
  const supabase = await createClient();
  const cover = [...property.property_images].sort((a, b) => a.position - b.position)[0];
  const coverUrl = cover
    ? supabase.storage.from("property-photos").getPublicUrl(cover.storage_path).data.publicUrl
    : null;

  const propertyPath = `/agentes/${agentSlug}/propiedades/${property.id}`;

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
        </div>
      </Link>

      <div className="flex flex-1 flex-col bg-emerald-50">
        <Link href={propertyPath} className="flex-1 p-4 pb-3">
          <h3 className="truncate font-display text-sm font-semibold text-prussian">{property.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
            <MapPin size={12} />
            {property.city}
          </p>
        </Link>

        <div className="flex items-center justify-between gap-2 border-t border-emerald-100 px-4 py-3">
          <p className="text-sm font-semibold text-prussian">
            {new Intl.NumberFormat("es-PY", { style: "currency", currency: property.currency }).format(
              property.price
            )}
            {property.listing_type === "rent" && (
              <span className="block text-xs font-normal text-slate-600">/mes</span>
            )}
          </p>
          <GenerateLinkButton propertyId={property.id} propertyPath={propertyPath} />
        </div>
      </div>
    </Card>
  );
}
