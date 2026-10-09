export type ZoomOrigin = "top-left" | "bottom-right";

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const ZOOM_START = 1.0;
const ZOOM_END = 1.1; // subtle, per spec
const PAN_FRACTION = 0.04; // subtle pan toward the zoom origin, as a fraction of canvas size

// A smooth Ken Burns zoom on the foreground only (background stays static,
// per spec). Alternates origin per segment so consecutive clips don't all
// zoom the same direction.
export function kenBurnsTransform(progress: number, origin: ZoomOrigin, width: number, height: number) {
  const t = easeInOutCubic(Math.min(1, Math.max(0, progress)));
  const scale = ZOOM_START + (ZOOM_END - ZOOM_START) * t;
  const sign = origin === "top-left" ? -1 : 1;
  return {
    scale,
    panX: sign * PAN_FRACTION * width * t,
    panY: sign * PAN_FRACTION * height * t,
  };
}
