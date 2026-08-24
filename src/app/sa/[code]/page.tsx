import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { copy } from "@/lib/copy";

// Mirrors /s/[code] (the affiliate short-link resolver) but for an agent
// sharing their own listing — resolves against agent_social_shares instead
// of short_links, and deliberately does NOT append a ?ref= param to the
// destination, since this isn't an affiliate referral and shouldn't be
// eligible for referral/commission attribution downstream.
async function getAgentShare(code: string) {
  const service = createServiceClient();
  const { data } = await service
    .from("agent_social_shares")
    .select("property_id, click_count, properties(title, price, currency, agent_profiles(slug))")
    .eq("code", code)
    .maybeSingle();

  return data as
    | {
        property_id: string;
        click_count: number;
        properties: { title: string; price: number; currency: string; agent_profiles: { slug: string } | null } | null;
      }
    | null;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const share = await getAgentShare(code);
  if (!share?.properties) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const imageUrl = `${siteUrl}/api/property-card/${share.property_id}`;
  const description = new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: share.properties.currency,
  }).format(share.properties.price);

  return {
    title: `${share.properties.title} — ${copy.brand}`,
    description,
    openGraph: {
      title: share.properties.title,
      description,
      images: [{ url: imageUrl, width: 1080, height: 1350 }],
    },
    twitter: {
      card: "summary_large_image",
      title: share.properties.title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function AgentSocialSharePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const share = await getAgentShare(code);
  if (!share?.properties?.agent_profiles) notFound();

  const service = createServiceClient();
  service.from("agent_social_shares").update({ click_count: share.click_count + 1 }).eq("code", code).then(() => {});

  const destination = `/agentes/${share.properties.agent_profiles.slug}/propiedades/${share.property_id}`;

  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${destination}`} />
      <p className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-500">Redirigiendo...</p>
    </>
  );
}
