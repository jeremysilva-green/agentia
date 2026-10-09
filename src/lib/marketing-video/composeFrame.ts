import { VIDEO_WIDTH, VIDEO_HEIGHT, type ListingVideoInput, type Segment } from "./types";
import { drawContainFit } from "./fit";
import { kenBurnsTransform } from "./kenBurns";
import { drawLogo } from "./logo";
import { clashDisplayFont, interFont } from "./fonts";
import { fitFontSize, wrapText } from "./textFit";
import { formatListingPrice, formatListingTypeLabel } from "./price";
import { formatLocationLine } from "./location";

const BRAND_GREEN = "#0A8F5C";
const WHITE = "#FFFFFF";

// Safe-area constants, per spec: keep the logo ~160-260px from the top,
// ~300-380px wide; keep all text out of the bottom ~400px and right ~140px
// (Reels/TikTok's own UI overlays that zone).
const LOGO_TOP = 200;
const LOGO_WIDTH = 340;
const CONTENT_RIGHT_MARGIN = 140;
const CONTENT_LEFT_MARGIN = 80;
const CONTENT_MAX_WIDTH = VIDEO_WIDTH - CONTENT_LEFT_MARGIN - CONTENT_RIGHT_MARGIN;
const INFO_BLOCK_BOTTOM = VIDEO_HEIGHT - 420; // bottom edge of the price/location block

function findSegment(segments: Segment[], frameIndex: number): Segment {
  return segments.find((s) => frameIndex >= s.startFrame && frameIndex < s.endFrame) ?? segments[segments.length - 1];
}

export function composeFrame(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  segments: Segment[],
  listing: ListingVideoInput
) {
  const segment = findSegment(segments, frameIndex);
  const segmentLength = segment.endFrame - segment.startFrame;
  const localProgress = segmentLength > 0 ? (frameIndex - segment.startFrame) / segmentLength : 0;

  ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

  // Background: static (no zoom), already blurred + darkened once per photo.
  ctx.drawImage(segment.background, 0, 0);

  // Foreground: contain-fit, Ken Burns zoom/pan applied around canvas center.
  const { scale, panX, panY } = kenBurnsTransform(localProgress, segment.zoomOrigin, VIDEO_WIDTH, VIDEO_HEIGHT);
  ctx.save();
  ctx.translate(VIDEO_WIDTH / 2 + panX, VIDEO_HEIGHT / 2 + panY);
  ctx.scale(scale, scale);
  ctx.translate(-VIDEO_WIDTH / 2, -VIDEO_HEIGHT / 2);
  drawContainFit(ctx, segment.image, segment.image.naturalWidth, segment.image.naturalHeight, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  ctx.restore();

  // Dedicated gradient scrim behind the info block — found via a real
  // rendered-frame review that the background's own blur+40%-black overlay
  // isn't reliably dark enough on its own (a bright photo left the price/
  // location text nearly illegible); this guarantees contrast regardless
  // of the underlying photo's brightness.
  const scrimTop = VIDEO_HEIGHT - 650;
  const scrimGradient = ctx.createLinearGradient(0, scrimTop, 0, VIDEO_HEIGHT);
  scrimGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  scrimGradient.addColorStop(0.45, "rgba(0, 0, 0, 0.55)");
  scrimGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
  ctx.fillStyle = scrimGradient;
  ctx.fillRect(0, scrimTop, VIDEO_WIDTH, VIDEO_HEIGHT - scrimTop);

  // Logo, top center.
  drawLogo(ctx, VIDEO_WIDTH / 2, LOGO_TOP, LOGO_WIDTH);

  // Listing info block, lower-middle, built bottom-up so it always lands
  // just above the unsafe zone regardless of how many lines it needs.
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const locationLine = formatLocationLine(listing);
  const priceText = formatListingPrice(listing.price, listing.currency);
  const typeLabel = formatListingTypeLabel(listing.listingType);

  const locationSize = 36;
  ctx.font = interFont(locationSize);
  const locationLines = locationLine ? wrapText(ctx, locationLine, CONTENT_MAX_WIDTH) : [];

  const { sizePx: priceSize, lines: priceLines } = fitFontSize(
    ctx,
    priceText,
    clashDisplayFont,
    CONTENT_MAX_WIDTH,
    1,
    108,
    64
  );

  const typeSize = 28;

  const gapTypeToPrice = 18;
  const gapPriceToLocation = 28;
  const lineGapLocation = 8;

  const locationBlockHeight = locationLines.length * (locationSize + lineGapLocation);
  const priceBlockHeight = priceLines.length * (priceSize * 1.1);
  const totalHeight = typeSize + gapTypeToPrice + priceBlockHeight + (locationLines.length > 0 ? gapPriceToLocation + locationBlockHeight : 0);

  let cursorY = INFO_BLOCK_BOTTOM - totalHeight;

  // Operation type pill (VENTA / ALQUILER).
  cursorY += typeSize;
  ctx.font = interFont(typeSize);
  const typeWidth = ctx.measureText(typeLabel).width;
  const pillPaddingX = 20;
  const pillHeight = typeSize + 16;
  ctx.fillStyle = BRAND_GREEN;
  const pillX = VIDEO_WIDTH / 2 - typeWidth / 2 - pillPaddingX;
  const pillY = cursorY - typeSize;
  const pillWidth = typeWidth + pillPaddingX * 2;
  const pillRadius = pillHeight / 2;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillRadius);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.fillText(typeLabel, VIDEO_WIDTH / 2, cursorY + 2);
  cursorY += gapTypeToPrice;

  // Price, with a soft shadow for legibility over varied photo backgrounds.
  ctx.font = clashDisplayFont(priceSize);
  ctx.fillStyle = WHITE;
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  for (const line of priceLines) {
    cursorY += priceSize;
    ctx.fillText(line, VIDEO_WIDTH / 2, cursorY);
    cursorY += priceSize * 0.1;
  }
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Location.
  if (locationLines.length > 0) {
    cursorY += gapPriceToLocation;
    ctx.font = interFont(locationSize);
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    for (const line of locationLines) {
      cursorY += locationSize;
      ctx.fillText(line, VIDEO_WIDTH / 2, cursorY);
      cursorY += lineGapLocation;
    }
  }
}
