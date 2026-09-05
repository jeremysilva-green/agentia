import sharp from "sharp";

// Property photos are unmoderated agent uploads and can be very large
// (seen: 8.9MB PNGs straight off a phone). Embedding that many raw bytes as
// base64 into an ImageResponse blows past Satori's internal SVG parser
// buffer limit ("XML_PARSE_HUGE") when it rasterizes via resvg. Re-encoding
// to a capped, compressed JPEG here keeps every OG/social-card render well
// under that limit regardless of what the agent originally uploaded.
const MAX_DIMENSION = 1600;

export async function resizeToDataUri(buffer: Buffer, maxDimension = MAX_DIMENSION): Promise<string> {
  const resized = await sharp(buffer)
    .rotate()
    .resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  return `data:image/jpeg;base64,${resized.toString("base64")}`;
}
