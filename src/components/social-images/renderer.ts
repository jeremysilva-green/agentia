import { readFile } from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { PropertyTemplate } from "./templates/PropertyTemplate";
import { PropertyFlyer, FLYER_WIDTH, FLYER_HEIGHT, type PropertyFlyerProps } from "./templates/PropertyFlyer";
import { CarouselSlide, SLIDE_WIDTH, SLIDE_HEIGHT } from "./templates/CarouselSlide";
import { loadBrandFonts, loadFlyerFonts, loadCarouselFonts } from "./fonts";
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

/** Property flyer (1520 x 2062): data in, PNG buffer out. */
export async function renderPropertyFlyer(props: PropertyFlyerProps): Promise<Buffer> {
  const fonts = await loadFlyerFonts();

  const svg = await satori(PropertyFlyer(props), { width: FLYER_WIDTH, height: FLYER_HEIGHT, fonts });

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: FLYER_WIDTH } });
  return resvg.render().asPng();
}

let cachedSlideLogo: string | null = null;

async function slideLogoDataUri(): Promise<string> {
  if (cachedSlideLogo) return cachedSlideLogo;
  const png = await readFile(path.join(process.cwd(), "assets", "agentia-logo.png"));
  cachedSlideLogo = `data:image/png;base64,${png.toString("base64")}`;
  return cachedSlideLogo;
}

/**
 * Instagram carousel slide (1080 x 1350) for the Make + Buffer flow: the
 * property's cover photo in a cream frame as slide `current` of `total`.
 * The Make scenario appends the static logo slide after it, hence 2 by default.
 */
export async function renderCarouselSlide({
  photoDataUri,
  current = 1,
  total = 2,
}: {
  photoDataUri: string;
  current?: number;
  total?: number;
}): Promise<Buffer> {
  const [fonts, logo] = await Promise.all([loadCarouselFonts(), slideLogoDataUri()]);

  const svg = await satori(
    CarouselSlide({ photo: photoDataUri, backgroundImage: photoDataUri, logo, current, total }),
    { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fonts }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: SLIDE_WIDTH } });
  return resvg.render().asPng();
}
