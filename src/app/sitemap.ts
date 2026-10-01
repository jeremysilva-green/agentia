import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://agentia.com.py";
  return ["", "/que-es-agentia", "/agentes", "/ranking-afiliados", "/registro", "/terminos", "/privacidad"].map(
    (path) => ({ url: base + path, lastModified: new Date() })
  );
}
