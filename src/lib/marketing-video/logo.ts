import { LOGO_PATH } from "@/components/social-images/LogoMark";

let cachedPath: Path2D | null = null;
function logoPath(): Path2D {
  if (!cachedPath) cachedPath = new Path2D(LOGO_PATH);
  return cachedPath;
}

// Mirrors LogoMark.tsx's SVG exactly: viewBox 0 0 896 932 drawn into a
// `size`×`size` box (default SVG preserveAspectRatio="xMidYMid meet" —
// uniform scale by the limiting dimension, 932, horizontally centered),
// then the inner <g transform="translate(0,932) scale(0.1,-0.1)"> that the
// path data itself was authored against.
export function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);

  const scale = size / 932;
  const xOffset = (size - 896 * scale) / 2;
  ctx.translate(xOffset, 0);
  ctx.scale(scale, scale);

  ctx.translate(0, 932);
  ctx.scale(0.1, -0.1);

  ctx.fillStyle = color;
  ctx.fill(logoPath());
  ctx.restore();
}
