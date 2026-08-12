import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { copy } from "@/lib/copy";

async function getShortLink(code: string) {
  const service = createServiceClient();
  const { data } = await service
    .from("short_links")
    .select("property_id, ref, click_count, properties(title, price, currency, agent_profiles(slug))")
    .eq("code", code)
    .maybeSingle();

  return data as
    | {
        property_id: string;
        ref: string;
        click_count: number;
        properties: { title: string; price: number; currency: string; agent_profiles: { slug: string } | null } | null;
      }
    | null;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const link = await getShortLink(code);
  if (!link?.properties) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const imageUrl = `${siteUrl}/api/property-card/${link.property_id}`;
  const description = new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: link.properties.currency,
  }).format(link.properties.price);

  return {
    title: `${link.properties.title} — ${copy.brand}`,
    description,
    openGraph: {
      title: link.properties.title,
      description,
      images: [{ url: imageUrl, width: 1080, height: 1350 }],
    },
    twitter: {
      card: "summary_large_image",
      title: link.properties.title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const link = await getShortLink(code);
  if (!link?.properties?.agent_profiles) notFound();

  const service = createServiceClient();
  service.from("short_links").update({ click_count: link.click_count + 1 }).eq("code", code).then(() => {});

  const destination = `/agentes/${link.properties.agent_profiles.slug}/propiedades/${link.property_id}?ref=${encodeURIComponent(
    link.ref
  )}`;

  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${destination}`} />
      <p className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-500">Redirigiendo...</p>
    </>
  );
}
