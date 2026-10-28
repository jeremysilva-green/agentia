import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";

const base = "https://agentia.com.py";

// Regenerated at most hourly, so a new listing reaches Google within the hour
// without every crawl hitting the database.
export const revalidate = 3600;

const STATIC_PATHS = ["", "/que-es-agentia", "/agentes", "/ranking-afiliados", "/registro", "/terminos", "/privacidad"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: base + path,
    lastModified: new Date(),
  }));

  // Service client: this runs outside any request, and only rows already
  // public (active agents, published properties) are ever selected.
  // If the database is unreachable at build time (env vars missing), ship the
  // static paths instead of failing the whole deploy; revalidate fills the rest.
  try {
    const supabase = createServiceClient();
    const [{ data: agents }, { data: properties }] = await Promise.all([
      supabase.from("agent_profiles").select("slug, updated_at").eq("is_active", true),
      supabase
        .from("properties")
        .select("id, updated_at, agent_profiles!inner(slug, is_active)")
        .eq("published", true)
        .eq("agent_profiles.is_active", true),
    ]);

    for (const agent of agents ?? []) {
      entries.push({ url: `${base}/agentes/${agent.slug}`, lastModified: new Date(agent.updated_at) });
    }
    for (const property of properties ?? []) {
      const slug = property.agent_profiles?.slug;
      if (!slug) continue;
      entries.push({
        url: `${base}/agentes/${slug}/propiedades/${property.id}`,
        lastModified: new Date(property.updated_at),
      });
    }
  } catch (error) {
    console.error("sitemap: could not load agents/properties", error);
  }

  return entries;
}
