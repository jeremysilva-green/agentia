// Shared cover/contain draw helpers — "cover" fills the target box and
// crops overflow (used for the blurred background), "contain" fits the
// whole image inside the box without cropping (used for the sharp
// foreground photo, per spec).

export function drawCoverFit(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number
) {
  const scale = Math.max(dWidth / imageWidth, dHeight / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const offsetX = dx + (dWidth - drawWidth) / 2;
  const offsetY = dy + (dHeight - drawHeight) / 2;
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

export function drawContainFit(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number
) {
  const scale = Math.min(dWidth / imageWidth, dHeight / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const offsetX = dx + (dWidth - drawWidth) / 2;
  const offsetY = dy + (dHeight - drawHeight) / 2;
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}
