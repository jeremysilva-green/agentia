import { createClient } from "@supabase/supabase-js";
import type { ListingType, PropertySocialCardProps } from "@/components/social-images/types";

// If the project already has a service-role client factory (e.g. in
// src/lib/supabase/server.ts), use that instead of this inline one —
// this exists standalone only so the file has no unverified import paths.
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function formatPrice(price: number, currency: string, includesIva: boolean): string {
  const formatted = new Intl.NumberFormat("es-PY").format(price);
  const symbol = currency === "USD" ? "$" : currency === "PYG" ? "₲" : `${currency} `;
  return `${symbol}${formatted}${includesIva ? "" : " + IVA"}`;
}

/**
 * Fetches everything PropertyTemplate needs for one property, including
 * downloading and base64-encoding the cover photo (Satori needs a data URI,
 * not a remote URL).
 *
 * ASSUMPTION TO VERIFY: this uses getPublicUrl() on the `property-photos`
 * bucket, which only works if that bucket is public. If it's private,
 * swap in createSignedUrl() instead.
 */
export async function getPropertyForSocialCard(
  propertyId: string
): Promise<PropertySocialCardProps> {
  const supabase = serviceClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select(
      `
      id, price, currency, price_includes_iva,
      city, address, listing_type,
      bedrooms, bathrooms, area_m2,
      property_images ( storage_path, position )
    `
    )
    .eq("id", propertyId)
    .single();

  if (error || !property) {
    throw new Error(`Property not found: ${propertyId}`);
  }

  const images = (property.property_images ?? []) as { storage_path: string; position: number }[];
  const cover = images.slice().sort((a, b) => a.position - b.position)[0];

  if (!cover) {
    throw new Error(`Property ${propertyId} has no images`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("property-photos")
    .getPublicUrl(cover.storage_path);

  const imageResponse = await fetch(publicUrlData.publicUrl);
  if (!imageResponse.ok) {
    throw new Error(`Could not fetch cover image for property ${propertyId}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageDataUri = `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString("base64")}`;

  const listingType: ListingType = property.listing_type === "rent" ? "rent" : "sale";

  return {
    price: formatPrice(property.price, property.currency, property.price_includes_iva),
    address: [property.address, property.city].filter(Boolean).join(", "),
    listingType,
    bedrooms: property.bedrooms ?? undefined,
    bathrooms: property.bathrooms ?? undefined,
    areaM2: property.area_m2 ?? undefined,
    imageDataUri,
  };
}
