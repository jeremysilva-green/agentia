import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // @resvg/resvg-js ships a native per-platform binary (e.g.
  // @resvg/resvg-js-darwin-arm64) loaded via a runtime require, and satori's
  // harfbuzzjs dependency loads a .wasm file relative to its own __dirname —
  // Turbopack's bundling breaks both path resolutions, so they need to stay
  // real Node requires instead.
  serverExternalPackages: ["@resvg/resvg-js", "satori", "harfbuzzjs"],
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
