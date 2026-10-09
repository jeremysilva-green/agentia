export function canShareFile(file: File): boolean {
  return typeof navigator !== "undefined" && "canShare" in navigator && navigator.canShare({ files: [file] });
}

export async function fetchAsFile(url: string, filename: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo descargar el video.");
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "video/mp4" });
}

// Copies the caption to the clipboard and opens the native share sheet —
// Instagram and TikTok ignore any text passed through navigator.share, so
// the caption has to be copied separately (the caller shows a toast/hint
// telling the agent to paste it).
export async function shareVideoFile(file: File, caption: string): Promise<void> {
  await navigator.clipboard.writeText(caption).catch(() => {});
  await navigator.share({ files: [file], text: caption });
}

export function buildWhatsAppShareUrl(caption: string): string {
  return `https://wa.me/?text=${encodeURIComponent(caption)}`;
}

export function downloadFile(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
