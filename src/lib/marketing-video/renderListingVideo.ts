import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_TOTAL_FRAMES, MAX_IMAGES, type ListingVideoInput, type RenderListingVideoOptions, type Segment } from "./types";
import { loadMarketingVideoFonts } from "./fonts";
import { loadLogoImage } from "./logo";
import { prerenderBlurredBackground } from "./background";
import { canUseWebCodecs, encodeWithWebCodecs } from "./encodeWebCodecs";
import { pickMediaRecorderMimeType, encodeWithMediaRecorder } from "./encodeMediaRecorder";

async function loadImage(url: string): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  // fetch → blob → object URL, so the canvas never becomes tainted (vs.
  // drawing directly from a cross-origin <img src="...">), per spec.
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo cargar una de las fotos.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const image = new Image();
  image.src = objectUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("No se pudo cargar una de las fotos."));
  });

  return { image, objectUrl };
}

function buildSegments(images: HTMLImageElement[], backgrounds: HTMLCanvasElement[]): Segment[] {
  const n = images.length;
  const base = Math.floor(VIDEO_TOTAL_FRAMES / n);
  const remainder = VIDEO_TOTAL_FRAMES % n;

  const segments: Segment[] = [];
  let frame = 0;
  for (let i = 0; i < n; i++) {
    const length = base + (i < remainder ? 1 : 0); // distribute the remainder so the total is exactly 300 frames
    segments.push({
      image: images[i],
      background: backgrounds[i],
      startFrame: frame,
      endFrame: frame + length,
      zoomOrigin: i % 2 === 0 ? "top-left" : "bottom-right", // alternate so consecutive clips don't feel repetitive
    });
    frame += length;
  }
  return segments;
}

// Renders a 10s/300-frame listing video entirely client-side and resolves
// with the finished MP4 (or WebM, on the MediaRecorder fallback path —
// see encodeMediaRecorder.ts) as a Blob. No React/Next dependency.
export async function renderListingVideo(
  listing: ListingVideoInput,
  imageUrls: string[],
  options: RenderListingVideoOptions = {}
): Promise<Blob> {
  const { onProgress } = options;
  onProgress?.({ phase: "loading" });

  await Promise.all([loadMarketingVideoFonts(), loadLogoImage()]);

  const urls = imageUrls.slice(0, MAX_IMAGES);
  if (urls.length === 0) throw new Error("La propiedad no tiene fotos.");

  const loaded = await Promise.all(urls.map(loadImage));
  const images = loaded.map((l) => l.image);
  const objectUrls = loaded.map((l) => l.objectUrl);

  try {
    const backgrounds = images.map((image) => prerenderBlurredBackground(image, VIDEO_WIDTH, VIDEO_HEIGHT));
    const segments = buildSegments(images, backgrounds);

    onProgress?.({ phase: "render", frame: 0, totalFrames: VIDEO_TOTAL_FRAMES });
    const reportFrame = (frame: number, total: number) => onProgress?.({ phase: "render", frame, totalFrames: total });

    const useWebCodecs = await canUseWebCodecs();

    let blob: Blob;
    if (useWebCodecs) {
      blob = await encodeWithWebCodecs(segments, listing, reportFrame);
    } else {
      const mimeType = pickMediaRecorderMimeType();
      if (!mimeType) {
        throw new Error("Tu navegador no puede generar video. Probá con una versión reciente de Chrome o Safari.");
      }
      blob = await encodeWithMediaRecorder(segments, listing, mimeType, reportFrame);
    }

    onProgress?.({ phase: "encoding" });
    return blob;
  } finally {
    for (const url of objectUrls) URL.revokeObjectURL(url);
  }
}
