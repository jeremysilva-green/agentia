import { canvasRGB } from "stackblur-canvas";
import { drawCoverFit } from "./fit";

const BLUR_RADIUS = 40; // "heavily blurred" per spec, well within stackblur's working range
const OVERLAY_ALPHA = 0.4; // ~35-45% black overlay per spec

// Pre-renders one photo's blurred, darkened background into an offscreen
// canvas — run ONCE per source photo (not per output frame, ~300x cheaper).
// Never relies on ctx.filter = 'blur()' (unreliable in Safari per spec) —
// stackblur-canvas gives the same result on every browser.
export function prerenderBlurredBackground(
  image: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el contexto de canvas.");

  drawCoverFit(ctx, image, image.naturalWidth, image.naturalHeight, 0, 0, width, height);
  canvasRGB(canvas, 0, 0, width, height, BLUR_RADIUS);

  ctx.fillStyle = `rgba(0, 0, 0, ${OVERLAY_ALPHA})`;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}
