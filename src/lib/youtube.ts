const VIDEO_ID_PATTERNS = [
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
  /youtube\.com\/shorts\/([\w-]{11})/,
  /youtube\.com\/embed\/([\w-]{11})/,
];

function extractVideoId(url: string): string | null {
  for (const pattern of VIDEO_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isLikelyYoutubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}

export function getYoutubeEmbedUrl(url: string): string | null {
  const videoId = extractVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}
