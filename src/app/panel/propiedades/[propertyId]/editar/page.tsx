import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PropertyForm } from "@/components/panel/PropertyForm";
import { PropertyPhotoManager } from "@/components/panel/PropertyPhotoManager";
import { DeletePropertyButton } from "@/components/panel/DeletePropertyButton";
import { MarketingVideoGenerator } from "@/components/panel/MarketingVideoGenerator";
import { updateProperty } from "@/lib/actions/properties";
import { getAgentContext } from "@/lib/data/panel";
import { getMarketingVideoForProperty } from "@/lib/data/marketingVideos";
import { isVideoStale } from "@/lib/marketing-video/isStale";
import { formatListingPrice, formatListingTypeLabel } from "@/lib/marketing-video/price";
import { formatLocationLine } from "@/lib/marketing-video/location";
import { getPublicStorageUrl } from "@/lib/storage";
import { getSiteUrl } from "@/lib/siteUrl";

export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const supabase = await createClient();
  const [{ data: property }, { data: images }, video] = await Promise.all([
    supabase.from("properties").select("*").eq("id", propertyId).eq("agent_id", ctx.userId).single(),
    supabase.from("property_images").select("*").eq("property_id", propertyId).order("position", { ascending: true }),
    getMarketingVideoForProperty(propertyId),
  ]);

  if (!property) notFound();

  const boundUpdate = updateProperty.bind(null, propertyId);
  const eligibleForVideo = ctx.subscription?.plan === "pro" || ctx.subscription?.plan === "fundador";
  const imageUrls = (images ?? []).map((img) => getPublicStorageUrl("property-photos", img.storage_path));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-white">Editar propiedad</h1>
        <DeletePropertyButton propertyId={propertyId} />
      </div>

      <Card className="border-slate-400! bg-slate-300! p-6 sm:p-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Fotos</h2>
        <PropertyPhotoManager
          propertyId={propertyId}
          agentId={ctx.userId}
          initialImages={images ?? []}
        />
      </Card>

      <Card className="border-slate-400! bg-slate-300! p-6 sm:p-8">
        <PropertyForm action={boundUpdate} defaultValues={property} submitLabel="Guardar cambios" />
      </Card>

      {imageUrls.length > 0 && (
        <Card className="border-slate-400! bg-slate-300! p-6 sm:p-8">
          {eligibleForVideo ? (
            <MarketingVideoGenerator
              propertyId={propertyId}
              agentId={ctx.userId}
              listing={{
                title: property.title,
                price: property.price,
                currency: property.currency,
                listingType: property.listing_type,
                city: property.city,
                address: property.address,
              }}
              imageUrls={imageUrls}
              caption={buildCaption(property, ctx.agentProfile?.slug ?? "", propertyId)}
              hasExistingVideo={Boolean(video)}
              isStale={video ? isVideoStale(video, property) : false}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-400 bg-slate-200 px-6 py-10 text-center">
              <Lock size={28} className="text-emerald-700" />
              <h2 className="font-display text-lg font-semibold text-slate-900">Video promocional</h2>
              <p className="max-w-sm text-sm text-slate-500">
                Esta función está disponible para los planes Pro y Fundador. Mejorá tu plan para empezar a usarla.
              </p>
              <Link
                href="/panel/suscripcion"
                className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
              >
                Ver planes
              </Link>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function buildCaption(
  property: { title: string; price: number; currency: string; listing_type: "rent" | "sale"; city: string; address: string | null },
  agentSlug: string,
  propertyId: string
): string {
  const price = formatListingPrice(property.price, property.currency);
  const type = formatListingTypeLabel(property.listing_type);
  const location = formatLocationLine(property);
  const url = `${getSiteUrl()}/agentes/${agentSlug}/propiedades/${propertyId}`;
  const cityTag = property.city.replace(/\s+/g, "").toLowerCase();

  return `${type}: ${property.title} — ${price}\n${location}\n${url}\n\n#inmueblesparaguay #${cityTag} #agentia`;
}
