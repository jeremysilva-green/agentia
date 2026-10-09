import { formatListingPrice, formatListingTypeLabel } from "./price";
import { formatLocationLine } from "./location";
import { getSiteUrl } from "@/lib/siteUrl";

export function buildListingVideoCaption(
  property: {
    title: string;
    price: number;
    currency: string;
    listing_type: "rent" | "sale";
    city: string;
    address: string | null;
  },
  agentSlug: string,
  propertyId: string
): string {
  const price = formatListingPrice(property.price, property.currency);
  const type = formatListingTypeLabel(property.listing_type);
  const location = formatLocationLine(property);
  const url = `${getSiteUrl()}/agentes/${agentSlug}/propiedades/${propertyId}`;
  const cityTag = property.city.replace(/\s+/g, "").toLowerCase();

  return `${type}: ${property.title} — ${price}\n${location}\n${url}\n\n#inmueblesparaguay #${cityTag} #agentiapy`;
}
