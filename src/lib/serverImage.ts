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

// Agents often upload screenshots or exports with a solid border around the
// picture (black or white letterboxing, but also grey or colored frames). In a
// frame that crops to fill, those borders show as dead stripes, so they are cut
// off first.
const TRIM_THRESHOLD = 16; // how far a pixel may differ from the border color (absorbs JPEG noise)
const TRIM_MAX_SHARE = 0.3; // never take more than 30% of a dimension off any one side
const TRIM_INSET = 2; // extra pixels so the border's anti-aliased edge goes too

async function cornerColor(img: Buffer, corner: "top-left" | "bottom-right"): Promise<[number, number, number]> {
  const { width = 1, height = 1 } = await sharp(img).metadata();
  const left = corner === "top-left" ? 0 : width - 1;
  const top = corner === "top-left" ? 0 : height - 1;
  const raw = await sharp(img).extract({ left, top, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
  return [raw[0], raw[1], raw[2]];
}

/**
 * Crops solid borders (any color) from the edges of a photo. Looks at the
 * top-left corner's color, then the bottom-right corner's, twice over, so a
 * border can be one color all round or differ between opposite sides. Returns
 * the original buffer untouched when there is nothing to remove, or when the
 * trim would take too much (so a plain sky is never eaten away).
 */
export async function trimLetterbox(buffer: Buffer): Promise<Buffer> {
  try {
    const original = await sharp(buffer).rotate().toBuffer();
    const meta = await sharp(original).metadata();
    const W = meta.width ?? 0;
    const H = meta.height ?? 0;
    if (!W || !H) return buffer;

    let current = original;
    let removed = { top: 0, bottom: 0, left: 0, right: 0 };

    for (const corner of ["top-left", "bottom-right", "top-left", "bottom-right"] as const) {
      const background = await cornerColor(current, corner);
      const before = await sharp(current).metadata();
      const { data, info } = await sharp(current)
        .trim({ background, threshold: TRIM_THRESHOLD })
        .toBuffer({ resolveWithObject: true });
      const dw = (before.width ?? 0) - info.width;
      const dh = (before.height ?? 0) - info.height;
      if (dw === 0 && dh === 0) continue;

      const left = -(info.trimOffsetLeft ?? 0);
      const top = -(info.trimOffsetTop ?? 0);
      removed = {
        left: removed.left + left,
        top: removed.top + top,
        right: removed.right + (dw - left),
        bottom: removed.bottom + (dh - top),
      };
      current = data;
    }

    const total = removed.top + removed.bottom + removed.left + removed.right;
    if (total === 0) return buffer;
    if (
      removed.left > W * TRIM_MAX_SHARE ||
      removed.right > W * TRIM_MAX_SHARE ||
      removed.top > H * TRIM_MAX_SHARE ||
      removed.bottom > H * TRIM_MAX_SHARE
    ) {
      return buffer;
    }

    const inner = await sharp(current).metadata();
    const w = (inner.width ?? 0) - 2 * TRIM_INSET;
    const h = (inner.height ?? 0) - 2 * TRIM_INSET;
    if (w < W * 0.4 || h < H * 0.4) return buffer;

    return await sharp(current).extract({ left: TRIM_INSET, top: TRIM_INSET, width: w, height: h }).toBuffer();
  } catch {
    return buffer;
  }
}
