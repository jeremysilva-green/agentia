const SHORTCODE_PATTERN = /instagram\.com\/(?:reel|reels|p|tv)\/([\w-]+)/;

function extractShortcode(url: string): string | null {
  const match = url.match(SHORTCODE_PATTERN);
  return match ? match[1] : null;
}

export function isLikelyInstagramReelUrl(url: string): boolean {
  return extractShortcode(url) !== null;
}

export function getInstagramEmbedUrl(url: string): string | null {
  const shortcode = extractShortcode(url);
  return shortcode ? `https://www.instagram.com/reel/${shortcode}/embed` : null;
}
