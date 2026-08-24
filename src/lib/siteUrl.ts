// Prefers an explicitly-set NEXT_PUBLIC_SITE_URL (needed once a real custom
// domain exists, since that's never Vercel's auto-assigned one), then falls
// back to VERCEL_URL — a system env var Vercel injects automatically on
// every deployment with that deployment's real URL, no config needed. Only
// falls back to localhost when neither is present (local dev). Without
// this, links/images built server-side resolve to a hardcoded localhost
// URL on every deployed preview, since NEXT_PUBLIC_SITE_URL is never set
// there (confirmed twice: the Instagram-post property_link, and the agent
// share-link table).
export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
