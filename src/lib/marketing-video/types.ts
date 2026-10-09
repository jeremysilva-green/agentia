export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;
export const VIDEO_DURATION_SECONDS = 10;
export const VIDEO_TOTAL_FRAMES = VIDEO_FPS * VIDEO_DURATION_SECONDS; // 300
export const MAX_IMAGES = 8;

export type ListingVideoInput = {
  title: string;
  price: number;
  currency: string;
  listingType: "rent" | "sale";
  city: string;
  address: string | null;
};

export type RenderProgress =
  | { phase: "loading" }
  | { phase: "render"; frame: number; totalFrames: number }
  | { phase: "encoding" };

export type RenderListingVideoOptions = {
  onProgress?: (progress: RenderProgress) => void;
};

// One Ken-Burns segment: a slice of the 10s timeline assigned to one photo.
export type Segment = {
  image: HTMLImageElement;
  background: HTMLCanvasElement; // pre-blurred, once per photo — never per frame
  startFrame: number;
  endFrame: number; // exclusive
  zoomOrigin: "top-left" | "bottom-right";
};
