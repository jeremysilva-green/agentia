export async function downloadPromoCard(propertyId: string) {
  const response = await fetch(`/api/property-card/${propertyId}`);
  if (!response.ok) return;

  const pngBlob = await response.blob();
  const bitmap = await createImageBitmap(pngBlob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);

  const jpegBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!jpegBlob) return;

  const url = URL.createObjectURL(jpegBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agently-${propertyId}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
