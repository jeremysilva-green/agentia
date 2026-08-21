export type ListingType = "sale" | "rent";

export interface PropertySocialCardProps {
  price: string; // pre-formatted, e.g. "$685,000" or "₲ 4.500.000.000"
  address: string; // e.g. "142 Willow Grove Lane, Austin TX"
  listingType: ListingType;
  bedrooms?: number;
  bathrooms?: number;
  areaM2?: number;
  /** Base64 data URI of the cover photo, pre-fetched server-side before rendering. */
  imageDataUri: string;
}

export type SocialImageFormat = "instagram-feed" | "instagram-story" | "square";

export const FORMAT_DIMENSIONS: Record<
  SocialImageFormat,
  { width: number; height: number }
> = {
  "instagram-feed": { width: 1080, height: 1350 },
  "instagram-story": { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

export const LISTING_TAG_LABEL: Record<ListingType, string> = {
  sale: "EN VENTA",
  rent: "EN ALQUILER",
};
