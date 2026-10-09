// Only these two weights exist on disk (public/fonts/) — Clash Display
// Semibold (600) and Inter Regular (400), the same files the server-side
// Satori pipeline uses (src/components/social-images/fonts.ts). Loaded here
// via the browser FontFace API instead, since this renderer runs in the
// browser, not Node.
const CLASH_DISPLAY = "ClashDisplayMV";
const INTER = "InterMV";

let loaded: Promise<void> | null = null;

export function loadMarketingVideoFonts(): Promise<void> {
  if (loaded) return loaded;

  loaded = (async () => {
    const [clash, inter] = await Promise.all([
      new FontFace(CLASH_DISPLAY, "url(/fonts/ClashDisplay-Semibold.otf)", { weight: "600" }).load(),
      new FontFace(INTER, "url(/fonts/Inter-Regular.ttf)", { weight: "400" }).load(),
    ]);
    document.fonts.add(clash);
    document.fonts.add(inter);
    await document.fonts.ready;
  })();

  return loaded;
}

export function clashDisplayFont(sizePx: number): string {
  return `600 ${sizePx}px ${CLASH_DISPLAY}`;
}

export function interFont(sizePx: number): string {
  return `400 ${sizePx}px ${INTER}`;
}
