import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { createServiceClient } from "@/lib/supabase/service";
import { getPublicStorageUrl } from "@/lib/storage";
import { resizeToDataUri, trimLetterbox } from "@/lib/serverImage";

const GREEN = "#13c47f";

// "landscape" (1200x630) is the standard link-preview shape; "vertical"
// (1080x1350) is 4:5.
const FORMATS = {
  landscape: { width: 1200, height: 630 },
  vertical: { width: 1080, height: 1350 },
};

// Route Handlers render outside the RSC client boundary, so lucide-react's
// ("use client") icon components can't be used here — inlined as raw SVG
// paths (copied from lucide-react) instead.
function Icon({ size, color, children }: { size: number; color: string; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function BedIcon(props: { size: number; color: string }) {
  return (
    <Icon {...props}>
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    </Icon>
  );
}

function BathIcon(props: { size: number; color: string }) {
  return (
    <Icon {...props}>
      <path d="M10 4 8 6" />
      <path d="M17 19v2" />
      <path d="M2 12h20" />
      <path d="M7 19v2" />
      <path d="M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
    </Icon>
  );
}

function RulerIcon(props: { size: number; color: string }) {
  return (
    <Icon {...props}>
      <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
      <path d="m14.5 12.5 2-2" />
      <path d="m11.5 9.5 2-2" />
      <path d="m8.5 6.5 2-2" />
      <path d="m17.5 15.5 2-2" />
    </Icon>
  );
}

// Fetches an image server-side and converts it to a data URI, instead of
// handing next/og's ImageResponse a raw remote URL to fetch+decode
// internally — that path has no error handling at all, so any transient
// failure (network blip, slow storage propagation right after upload, an
// unusually large or malformed file) 500s the entire route. Pre-fetching
// here lets a failure degrade gracefully to the existing placeholder UI
// instead of taking down the whole image response.
async function fetchImageAsDataUri(url: string): Promise<{ dataUri: string; landscape: boolean } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("[property-card] image fetch failed", url, response.status);
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    // Photos uploaded with black/white/grey bars would show them inside the frame.
    const trimmed = await trimLetterbox(buffer);
    // Measured after rotate(), so a sideways phone photo counts by how it displays.
    const rotated = await sharp(trimmed).rotate().toBuffer({ resolveWithObject: true });
    return {
      dataUri: await resizeToDataUri(rotated.data),
      landscape: rotated.info.width >= rotated.info.height,
    };
  } catch (err) {
    console.error("[property-card] image fetch threw", url, err);
    return null;
  }
}

// How many gallery photos to look through for a horizontal one before giving
// up and cropping the first photo.
const MAX_PHOTOS_TO_TRY = 6;

async function pickCoverDataUri(urls: string[], preferLandscape: boolean): Promise<string | null> {
  if (urls.length === 0) return null;
  let first: string | null = null;
  for (const url of urls.slice(0, preferLandscape ? MAX_PHOTOS_TO_TRY : 1)) {
    const image = await fetchImageAsDataUri(url);
    if (!image) continue;
    if (!preferLandscape || image.landscape) return image.dataUri;
    first ??= image.dataUri;
  }
  return first;
}

// Fetching + resizing a large agent-uploaded cover photo can run past
// Vercel's default function timeout, killing the invocation with no
// catchable error (confirmed via Vercel logs: 500 with zero log output).
export const maxDuration = 30;

export async function GET(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;
  const service = createServiceClient();

  const { data: property } = await service
    .from("properties")
    .select("bedrooms, bathrooms, area_m2, property_images(storage_path, position)")
    .eq("id", propertyId)
    .eq("published", true)
    .single();

  if (!property) {
    return new Response("No encontrado", { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format") === "vertical" ? "vertical" : "landscape";

  // The landscape card prefers the first horizontal photo of the gallery; if
  // every photo is vertical it falls back to cropping the first one.
  const photoUrls = [...(property.property_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((image) => getPublicStorageUrl("property-photos", image.storage_path));

  const [semiboldFont, coverDataUri] = await Promise.all([
    readFile(join(process.cwd(), "font", "ClashDisplay-Semibold.otf")),
    pickCoverDataUri(photoUrls, format === "landscape"),
  ]);

  const { width, height } = FORMATS[format];
  const vertical = format === "vertical";
  // Everything scales off the canvas width so both shapes keep the same look.
  const px = (value: number) => Math.round((value * width) / 1080);

  const stats: { icon: typeof BedIcon; text: string }[] = [];
  if (property.bedrooms != null) stats.push({ icon: BedIcon, text: `${property.bedrooms} Hab.` });
  if (property.bathrooms != null) stats.push({ icon: BathIcon, text: `${property.bathrooms} Baños` });
  if (property.area_m2 != null) stats.push({ icon: RulerIcon, text: `${property.area_m2}m²` });

  const fade = (direction: "top" | "bottom", size: number) => ({
    display: "flex" as const,
    position: "absolute" as const,
    left: 0,
    right: 0,
    [direction]: 0,
    height: size,
    backgroundImage: `linear-gradient(to ${direction === "top" ? "bottom" : "top"}, rgba(0,0,0,0.88), rgba(0,0,0,0))`,
  });

  const rendered = new ImageResponse(
    (
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", background: "#12100e" }}>
        {coverDataUri && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverDataUri}
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            alt=""
          />
        )}

        {stats.length > 0 && <div style={fade("bottom", px(vertical ? 420 : 300))} />}

        {stats.length > 0 && (
          <div
            style={{
              position: "absolute",
              left: px(48),
              right: px(48),
              bottom: px(vertical ? 56 : 44),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {stats.map((stat, i) => (
              <div key={stat.text} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && (
                  <div
                    style={{
                      display: "flex",
                      width: px(2),
                      height: px(40),
                      background: "rgba(255,255,255,0.35)",
                      margin: `0 ${px(vertical ? 32 : 28)}px`,
                    }}
                  />
                )}
                <div style={{ display: "flex", alignItems: "center", gap: px(14) }}>
                  <stat.icon size={px(vertical ? 44 : 40)} color={GREEN} />
                  <div
                    style={{
                      display: "flex",
                      fontFamily: "ClashSemibold",
                      fontSize: px(vertical ? 44 : 40),
                      color: "#ffffff",
                    }}
                  >
                    {stat.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    {
      width,
      height,
      fonts: [{ name: "ClashSemibold", data: semiboldFont, style: "normal", weight: 600 }],
    }
  );

  // WhatsApp's link-preview crawler drops og:images over ~300 KB, and the raw
  // PNG is ~1 MB — so it never showed. Re-encode as JPEG and set the cache
  // headers on our own Response (ImageResponse's `headers` option didn't reach
  // the live site), so only the first hit per property pays the render.
  const png = Buffer.from(await rendered.arrayBuffer());
  const jpeg = await sharp(png).flatten({ background: "#000000" }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
