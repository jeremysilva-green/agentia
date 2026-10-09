const LOGO_SRC = "/agentia-02.png";

let logoImage: HTMLImageElement | null = null;
let loadingPromise: Promise<HTMLImageElement> | null = null;

// Must be awaited (alongside font loading) before the first drawLogo() call
// — canvas drawImage needs the image already decoded, and this runs once
// per render rather than once per frame.
export function loadLogoImage(): Promise<HTMLImageElement> {
  if (logoImage) return Promise.resolve(logoImage);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      logoImage = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error("No se pudo cargar el logo."));
    img.src = LOGO_SRC;
  });
  return loadingPromise;
}

const PLATE_PADDING_X = 28;
const PLATE_PADDING_Y = 18;
const PLATE_RADIUS = 16;

// Draws the full Agentia wordmark (green house mark + black "AGENTIA" text,
// agentia-02.png — transparent background) centered at centerX, top edge at
// `top`, scaled to targetWidth. The source PNG has a transparent background
// with BLACK text, which would be nearly illegible over a dark or busy
// photo, so a white backing plate is drawn behind it for guaranteed
// contrast, the same fix already applied to the price/location text block.
export function drawLogo(ctx: CanvasRenderingContext2D, centerX: number, top: number, targetWidth: number) {
  if (!logoImage) throw new Error("drawLogo called before loadLogoImage() resolved.");

  const aspect = logoImage.naturalWidth / logoImage.naturalHeight;
  const height = targetWidth / aspect;
  const x = centerX - targetWidth / 2;

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.beginPath();
  ctx.roundRect(
    x - PLATE_PADDING_X,
    top - PLATE_PADDING_Y,
    targetWidth + PLATE_PADDING_X * 2,
    height + PLATE_PADDING_Y * 2,
    PLATE_RADIUS
  );
  ctx.fill();
  ctx.restore();

  ctx.drawImage(logoImage, x, top, targetWidth, height);
}
