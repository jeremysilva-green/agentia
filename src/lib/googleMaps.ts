const COORDINATE_PATTERNS = [
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
];

function parseCoordinates(url: string): { lat: number; lng: number } | null {
  for (const pattern of COORDINATE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }
  return null;
}

/**
 * Extracts lat/lng from a Google Maps share link. Short links
 * (maps.app.goo.gl, goo.gl/maps) don't carry coordinates in the URL itself,
 * so those are resolved via a redirect fetch first.
 */
export async function extractLatLngFromMapsUrl(rawUrl: string): Promise<{ lat: number; lng: number } | null> {
  const url = rawUrl.trim();
  if (!url) return null;

  const direct = parseCoordinates(url);
  if (direct) return direct;

  if (/goo\.gl|maps\.app\.goo\.gl/.test(url)) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (response.url) return parseCoordinates(response.url);
    } catch {
      return null;
    }
  }

  return null;
}

export function isLikelyGoogleMapsUrl(url: string): boolean {
  return /google\.\w+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl/.test(url);
}
