import type { NextConfig } from "next";
import path from "path";
import { META_BLOCKED_PREFIXES } from "./src/lib/metaPixel";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // @resvg/resvg-js ships a native per-platform binary (e.g.
  // @resvg/resvg-js-darwin-arm64) loaded via a runtime require, and satori's
  // harfbuzzjs dependency loads a .wasm file relative to its own __dirname —
  // Turbopack's bundling breaks both path resolutions, so they need to stay
  // real Node requires instead.
  serverExternalPackages: ["@resvg/resvg-js", "satori", "harfbuzzjs", "sharp"],
  // marking sharp external (above) stops Turbopack from trying to inline it,
  // but Vercel's deployed function still crashed with ERR_DLOPEN_FAILED:
  // libvips-cpp.so.8.18.6 missing — Turbopack's output tracing doesn't
  // follow sharp's dlopen of its separate @img/sharp-libvips-linux-x64
  // package, so that .so file never made it into the deployed bundle.
  // Force-include it (confirmed via Vercel's own function logs).
  outputFileTracingIncludes: {
    "/api/property-card/\\[propertyId\\]": [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
    "/api/social-images/generate": [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
  // The agent survey is a standalone static page (public/encuesta.html) with
  // its own styles and submit script — served at the clean /encuesta URL and
  // kept out of search results.
  async rewrites() {
    return [{ source: "/encuesta", destination: "/encuesta.html" }];
  },
  // Visitors skip the landing page (src/app/page.tsx, kept in the repo) and
  // go straight to the public agents portal. Temporary (307) so the landing
  // can come back without browsers having cached a permanent redirect.
  async redirects() {
    return [{ source: "/", destination: "/agentes", permanent: false }];
  },
  async headers() {
    return [
      // Blocked-from-Meta routes (account, panels, agreements, short links):
      // anything leaving them carries at most the site origin as referrer, never
      // the path — which can hold a private code — so a later public page can't
      // report it to Meta as document.referrer.
      ...META_BLOCKED_PREFIXES.flatMap((prefix) =>
        [prefix, `${prefix}/:path*`].map((source) => ({
          source,
          headers: [{ key: "Referrer-Policy", value: "strict-origin" }],
        }))
      ),
      { source: "/encuesta", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/encuesta.html", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
  experimental: {
    serverActions: {
      // Owners can attach up to three document photos/PDFs (título,
      // impuesto, C.I.) in one Acuerdo Privado submission — phone photos
      // alone can exceed the 1MB default.
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/storage/v1/object/public/**" },
      { protocol: "http", hostname: "localhost", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
