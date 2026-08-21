import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { PropertyTemplate } from "./templates/PropertyTemplate";
import { loadBrandFonts } from "./fonts";
import {
  FORMAT_DIMENSIONS,
  type PropertySocialCardProps,
  type SocialImageFormat,
} from "./types";

/**
 * Pure rendering function: data in, PNG buffer out.
 * No business logic, no auth, no Storage upload — those stay in the API route.
 */
export async function renderPropertyCard(
  props: PropertySocialCardProps,
  format: SocialImageFormat = "instagram-feed"
): Promise<Buffer> {
  const { width, height } = FORMAT_DIMENSIONS[format];
  const fonts = await loadBrandFonts();

  const svg = await satori(
    PropertyTemplate({ ...props, width, height }),
    { width, height, fonts }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  return resvg.render().asPng();
}
