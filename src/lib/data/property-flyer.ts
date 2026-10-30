import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { FlyerContact, FlyerStat, PropertyFlyerProps } from "@/components/social-images/templates/PropertyFlyer";
import { FLYER_WIDTH, FLYER_HEIGHT, DEFAULT_FLYER_ACCENT } from "@/components/social-images/templates/PropertyFlyer";
import { getPublicStorageUrl } from "@/lib/storage";
import { resizeToDataUri } from "@/lib/serverImage";

const DESCRIPTION_LIMIT = 120;

export class FlyerError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

// Only images already stored in our own Supabase Storage are fetched: avatar
// and logo URLs live in profile rows the agent can edit.
function isOwnStorageUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(base) && url.startsWith(`${base}/storage/v1/object/public/`);
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function photoDataUri(url: string): Promise<string | null> {
  if (!isOwnStorageUrl(url)) return null;
  const buffer = await fetchBuffer(url);
  if (!buffer) return null;
  try {
    // JPEG has no alpha: flatten transparent PNG avatars onto a light tile.
    const jpeg = await sharp(buffer)
      .rotate()
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#dddddd" })
      .jpeg({ quality: 88 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * The logo as a PNG data URI plus the color of its top-left pixel, which the
 * template uses as the tile color so the logo reaches every edge of the tile
 * (transparent corners fall back to white).
 */
async function logoWithBackground(url: string): Promise<{ uri: string; bg: string } | null> {
  if (!isOwnStorageUrl(url)) return null;
  const buffer = await fetchBuffer(url);
  if (!buffer) return null;
  try {
    const png = await sharp(buffer)
      .rotate()
      .resize({ width: 500, height: 500, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    const [r, g, b, a] = await sharp(png)
      .ensureAlpha()
      .extract({ left: 0, top: 0, width: 1, height: 1 })
      .raw()
      .toBuffer();
    const bg = a < 200 ? "#FFFFFF" : `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    return { uri: `data:image/png;base64,${png.toString("base64")}`, bg };
  } catch {
    return null;
  }
}

let cachedAgentiaIcon: { uri: string; bg: string } | null = null;

/**
 * The Agentia icon (assets/Icon.png, a solid green tile) used as the corner
 * logo when the person has none of their own.
 */
async function agentiaIcon(): Promise<{ uri: string; bg: string } | null> {
  if (cachedAgentiaIcon) return cachedAgentiaIcon;
  try {
    const png = await sharp(await readFile(path.join(process.cwd(), "assets", "Icon.png")))
      .resize({ width: 500, height: 500, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    const [r, g, b] = await sharp(png).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
    cachedAgentiaIcon = {
      uri: `data:image/png;base64,${png.toString("base64")}`,
      bg: `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`,
    };
    return cachedAgentiaIcon;
  } catch {
    return null;
  }
}

/** Normalizes a user-supplied color to #rrggbb, or the default golden accent. */
export function parseAccent(value: string | null | undefined): string {
  const hex = value?.trim().replace(/^#/, "") ?? "";
  return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex.toLowerCase()}` : DEFAULT_FLYER_ACCENT;
}

/** Cover photo, cropped to the canvas, grayscale and blurred — the flyer's backdrop. */
async function blurredBackground(buffer: Buffer): Promise<string> {
  const out = await sharp(buffer)
    .rotate()
    .resize(FLYER_WIDTH, FLYER_HEIGHT, { fit: "cover" })
    .grayscale()
    .blur(14)
    .jpeg({ quality: 80 })
    .toBuffer();
  return `data:image/jpeg;base64,${out.toString("base64")}`;
}

function formatPrice(amount: number, currency: string): string {
  const number = new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(amount);
  return currency === "USD" ? `USD ${number}` : `Gs. ${number}`;
}

function clean(text: string): string {
  return (
    text
      // Figtree has no emoji, so they would print as empty boxes.
      .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D\u20E3]/gu, "")
      // Stray \r (text pasted from Word/Windows) corrupts Satori's line wrapping.
      .replace(/\r/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function truncate(text: string, limit: number): string {
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
}

type FlyerProperty = Database["public"]["Tables"]["properties"]["Row"] & {
  property_images: { storage_path: string; position: number }[] | null;
  property_coverage_cities: { city: string }[] | null;
};

/** Whoever the flyer presents: the listing's agent, or an affiliate sharing it. */
type FlyerPerson = {
  name: string;
  title: string;
  phone: string | null;
  avatarUrl: string | null;
  logoUrl: string | null;
  /** Shown as the website row, e.g. "agentia.com.py/agentes/jere". */
  website: string | null;
};

const PROPERTY_SELECT = "*, property_images(storage_path, position), property_coverage_cities(city)";

/**
 * Builds the flyer data for a listing the signed-in agent owns. `supabase` is
 * the agent's own (RLS) client, so another agent's listing simply isn't found.
 */
export async function getPropertyFlyerProps(
  supabase: SupabaseClient<Database>,
  propertyId: string,
  userId: string,
  accent: string = DEFAULT_FLYER_ACCENT,
  showLogo = true
): Promise<PropertyFlyerProps> {
  const [{ data: property }, { data: profile }, { data: agent }] = await Promise.all([
    supabase.from("properties").select(PROPERTY_SELECT).eq("id", propertyId).eq("agent_id", userId).single(),
    supabase.from("profiles").select("full_name, username, phone, avatar_url").eq("id", userId).single(),
    supabase.from("agent_profiles").select("slug, logo_url").eq("id", userId).single(),
  ]);

  if (!property) throw new FlyerError("No encontramos la propiedad.", 404);

  return buildFlyerProps(property as FlyerProperty, {
    accent,
    showLogo,
    person: {
      name: clean(profile?.full_name ?? "") || profile?.username || "Agente",
      title: "AGENTE INMOBILIARIO",
      phone: profile?.phone ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      logoUrl: agent?.logo_url ?? null,
      website: agent?.slug ? `agentia.com.py/agentes/${agent.slug}` : null,
    },
  });
}

/**
 * Same flyer for an affiliate sharing any published listing: their photo and
 * phone, their own affiliate link as the website, and no agent logo.
 */
export async function getAffiliateFlyerProps(
  supabase: SupabaseClient<Database>,
  propertyId: string,
  userId: string,
  shortCode: string,
  accent: string = DEFAULT_FLYER_ACCENT,
  showLogo = false
): Promise<PropertyFlyerProps> {
  const [{ data: property }, { data: profile }] = await Promise.all([
    supabase.from("properties").select(PROPERTY_SELECT).eq("id", propertyId).eq("published", true).single(),
    supabase.from("profiles").select("full_name, username, phone, avatar_url").eq("id", userId).single(),
  ]);

  if (!property) throw new FlyerError("No encontramos la propiedad.", 404);

  return buildFlyerProps(property as FlyerProperty, {
    accent,
    showLogo,
    person: {
      name: clean(profile?.full_name ?? "") || profile?.username || "Afiliado",
      title: "AFILIADO AGENTIA",
      phone: profile?.phone ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      logoUrl: null,
      website: `agentia.com.py/s/${shortCode}`,
    },
  });
}

async function buildFlyerProps(
  property: FlyerProperty,
  { person, accent, showLogo }: { person: FlyerPerson; accent: string; showLogo: boolean }
): Promise<PropertyFlyerProps> {
  const cover = [...(property.property_images ?? [])].sort((a, b) => a.position - b.position)[0];
  if (!cover) throw new FlyerError("Subí al menos una foto para crear el flyer.", 422);

  const coverBuffer = await fetchBuffer(getPublicStorageUrl("property-photos", cover.storage_path));
  if (!coverBuffer) throw new FlyerError("No pudimos cargar la foto de portada.", 502);

  const [propertyImage, backgroundImage, agentPhoto, logo] = await Promise.all([
    resizeToDataUri(coverBuffer),
    blurredBackground(coverBuffer),
    person.avatarUrl ? photoDataUri(person.avatarUrl) : Promise.resolve(null),
    !showLogo
      ? Promise.resolve(null)
      : (person.logoUrl ? logoWithBackground(person.logoUrl) : Promise.resolve(null)).then((own) => own ?? agentiaIcon()),
  ]);

  const isModelo = property.listing_kind === "modelo";
  const isPozo = property.listing_kind === "proyecto_en_pozo";

  // Modelo listings have no public price: property.price is the private precio
  // contado and must never end up on a flyer that gets shared.
  const headline = isModelo
    ? `Cuota ${formatPrice(property.model_installment_from ?? 0, property.currency)}`
    : isPozo
      ? `Desde ${formatPrice(property.price, property.currency)}`
      : formatPrice(property.price, property.currency);
  const kicker = isModelo ? "CONSTRUIMOS EN TU TERRENO" : isPozo ? "PROYECTO EN POZO" : "EN VENTA";

  const coverageCities = (property.property_coverage_cities ?? []).map((c) => c.city);
  const locationText = isModelo ? coverageCities.slice(0, 2).join(", ") || property.city : property.city;
  const location = truncate(clean(`${locationText}, Paraguay`).toUpperCase(), 40);

  const stats: FlyerStat[] = [];
  if (property.bedrooms != null) stats.push({ icon: "bed", value: String(property.bedrooms), label: "DORMITORIOS" });
  if (property.bathrooms != null) stats.push({ icon: "bath", value: String(property.bathrooms), label: "BAÑOS" });
  if (property.area_m2 != null) {
    stats.push({
      icon: "area",
      value: `${new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 }).format(property.area_m2)} m²`,
      label: isModelo ? "CONSTRUCCIÓN" : "SUPERFICIE",
    });
  }
  if (isModelo && property.model_construction_term_months != null) {
    stats.push({ icon: "house", value: `${property.model_construction_term_months} meses`, label: "PLAZO DE OBRA" });
  }
  if (isPozo && property.total_units != null) {
    stats.push({ icon: "house", value: String(property.total_units), label: "UNIDADES" });
  }
  if (!isModelo && !isPozo && property.garage) stats.push({ icon: "car", value: "Sí", label: "COCHERA" });

  const contacts: FlyerContact[] = [];
  if (person.phone) contacts.push({ type: "phone", value: person.phone });
  if (person.website) contacts.push({ type: "website", value: truncate(person.website, 36) });

  return {
    propertyImage,
    backgroundImage,
    agentPhoto,
    logo: logo?.uri ?? null,
    logoBg: logo?.bg ?? "#FFFFFF",
    showLogo,
    accent,
    agentName: person.name,
    agentTitle: person.title,
    contacts,
    kicker,
    headline,
    location,
    description: truncate(clean(property.description), DESCRIPTION_LIMIT),
    stats: stats.slice(0, 5),
  };
}
