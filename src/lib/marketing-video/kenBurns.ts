function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const ZOOM_START = 1.0;
const ZOOM_END = 1.1; // subtle, per spec

// A smooth Ken Burns zoom on the foreground only (background stays static,
// per spec), anchored at the exact canvas center for the whole segment —
// an earlier version also panned the pivot point as it zoomed, which made
// the anchor visibly drift instead of reading as a clean center zoom.
export function kenBurnsTransform(progress: number) {
  const t = easeInOutCubic(Math.min(1, Math.max(0, progress)));
  return { scale: ZOOM_START + (ZOOM_END - ZOOM_START) * t };
}
