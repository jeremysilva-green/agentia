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

// Some agents upload a finished flyer (cream frame, title banner, text panel,
// logo footer) instead of a plain photo. These numbers decide whether an image
// is one, and where the real photo sits inside it.
const FRAME_WORK_WIDTH = 360; // analysis runs on a small copy
const FRAME_RING_SHARE = 0.015; // outer ring of the image sampled for the frame color
const FRAME_RING_MIN_MATCH = 0.9; // share of the ring that must be the frame color
const FRAME_MIN_BACKGROUND_SHARE = 0.2; // the frame color must cover at least this much of the image
const FRAME_COLOR_DISTANCE = 26; // max per-channel difference to count as "frame color"
const FRAME_PHOTO_LINE_MAX_BACKGROUND = 0.4; // a row/column with less frame color than this is photo
const FRAME_MAX_GAP_SHARE = 0.015; // thin lines or pins inside the photo don't split it
const FRAME_INSET_SHARE = 0.02; // drops the photo's own thin border line
const FRAME_MIN_PHOTO_SHARE = 0.3; // never keep less than this of each dimension

function longestRun(isPhoto: boolean[], maxGap: number): [number, number] | null {
  let best: [number, number] | null = null;
  let start = -1;
  let last = -1;
  for (let i = 0; i <= isPhoto.length; i++) {
    const photo = i < isPhoto.length && isPhoto[i];
    if (photo) {
      if (start === -1) start = i;
      last = i;
    } else if (start !== -1 && (i >= isPhoto.length || i - last > maxGap)) {
      if (!best || last - start > best[1] - best[0]) best = [start, last];
      start = -1;
    }
  }
  return best;
}

/**
 * When the upload is a designed flyer, returns just the photo inside it:
 * the frame color is read from the image's outer ring, then the rows and
 * columns that are mostly that color (banner, text panel, margins) are cut
 * away. Anything that isn't clearly a frame around a photo comes back
 * untouched, so ordinary photos are never cropped. Text drawn onto the photo
 * itself stays; only the flyer's own frame and text blocks go.
 */
export async function cropDesignedFrame(buffer: Buffer): Promise<Buffer> {
  try {
    const original = await sharp(buffer).rotate().toBuffer();
    const meta = await sharp(original).metadata();
    const W = meta.width ?? 0;
    const H = meta.height ?? 0;
    if (!W || !H) return buffer;

    const { data, info } = await sharp(original)
      .resize({ width: FRAME_WORK_WIDTH, withoutEnlargement: true })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    const px = (x: number, y: number) => (y * w + x) * 3;

    // Frame color: the most common color (coarse buckets) in the outer ring.
    const ringX = Math.max(2, Math.round(w * FRAME_RING_SHARE));
    const ringY = Math.max(2, Math.round(h * FRAME_RING_SHARE));
    const inRing = (x: number, y: number) => x < ringX || x >= w - ringX || y < ringY || y >= h - ringY;
    const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
    let ringTotal = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!inRing(x, y)) continue;
        const i = px(x, y);
        const key = `${data[i] >> 4}-${data[i + 1] >> 4}-${data[i + 2] >> 4}`;
        const entry = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
        entry.count++;
        entry.r += data[i];
        entry.g += data[i + 1];
        entry.b += data[i + 2];
        buckets.set(key, entry);
        ringTotal++;
      }
    }
    const top = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
    if (!top) return buffer;
    const bg = [top.r / top.count, top.g / top.count, top.b / top.count];
    const isBackground = (x: number, y: number) => {
      const i = px(x, y);
      return (
        Math.abs(data[i] - bg[0]) <= FRAME_COLOR_DISTANCE &&
        Math.abs(data[i + 1] - bg[1]) <= FRAME_COLOR_DISTANCE &&
        Math.abs(data[i + 2] - bg[2]) <= FRAME_COLOR_DISTANCE
      );
    };

    let ringMatch = 0;
    let allMatch = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!isBackground(x, y)) continue;
        allMatch++;
        if (inRing(x, y)) ringMatch++;
      }
    }
    if (ringMatch / ringTotal < FRAME_RING_MIN_MATCH) return buffer;
    if (allMatch / (w * h) < FRAME_MIN_BACKGROUND_SHARE) return buffer;

    const rowBg = new Array<number>(h).fill(0);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) if (isBackground(x, y)) rowBg[y]++;
    }
    const rows = longestRun(
      rowBg.map((count) => count / w < FRAME_PHOTO_LINE_MAX_BACKGROUND),
      Math.round(h * FRAME_MAX_GAP_SHARE)
    );
    if (!rows) return buffer;

    // Columns are measured only inside the photo rows found above.
    const colBg = new Array<number>(w).fill(0);
    for (let y = rows[0]; y <= rows[1]; y++) {
      for (let x = 0; x < w; x++) if (isBackground(x, y)) colBg[x]++;
    }
    const rowSpan = rows[1] - rows[0] + 1;
    const cols = longestRun(
      colBg.map((count) => count / rowSpan < FRAME_PHOTO_LINE_MAX_BACKGROUND),
      Math.round(w * FRAME_MAX_GAP_SHARE)
    );
    if (!cols) return buffer;

    const insetX = Math.round(w * FRAME_INSET_SHARE);
    const insetY = Math.round(h * FRAME_INSET_SHARE);
    const scaleX = W / w;
    const scaleY = H / h;
    const left = Math.round((cols[0] + insetX) * scaleX);
    const topPx = Math.round((rows[0] + insetY) * scaleY);
    const width = Math.round((cols[1] - cols[0] + 1 - 2 * insetX) * scaleX);
    const height = Math.round((rows[1] - rows[0] + 1 - 2 * insetY) * scaleY);
    if (width < W * FRAME_MIN_PHOTO_SHARE || height < H * FRAME_MIN_PHOTO_SHARE) return buffer;
    if (width >= W * 0.97 && height >= H * 0.97) return buffer;

    return await sharp(original)
      .extract({ left, top: topPx, width: Math.min(width, W - left), height: Math.min(height, H - topPx) })
      .toBuffer();
  } catch {
    return buffer;
  }
}
