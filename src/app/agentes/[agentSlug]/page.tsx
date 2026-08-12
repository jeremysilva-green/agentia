import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { PropertyFilterBar } from "@/components/marketplace/PropertyFilterBar";
import { PropertyCard } from "@/components/property/PropertyCard";
import { getAgentBySlug, getAgentProperties, getAgentRatingSummary } from "@/lib/data/agentPortfolio";
import { getMilestone } from "@/lib/ratings";
import { createClient } from "@/lib/supabase/server";
import { AvatarUploader } from "@/components/panel/AvatarUploader";
import { ClientRequestTabs } from "@/components/marketplace/ClientRequestTabs";
import { RateAgentWidget } from "@/components/property/RateAgentWidget";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { parsePropertyTypeParam } from "@/lib/constants/propertyTypes";

export default async function AgentPortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentSlug: string }>;
  searchParams: Promise<{ city?: string; listingType?: string; propertyType?: string | string[] }>;
}) {
  const { agentSlug } = await params;
  const filters = await searchParams;

  const agent = await getAgentBySlug(agentSlug);
  if (!agent) notFound();

  const profile = (agent as typeof agent & {
    profiles: { username: string; full_name: string | null; avatar_url: string | null } | null;
  }).profiles;

  const [properties, ratingSummary] = await Promise.all([
    getAgentProperties(agent.id, {
      city: filters.city || undefined,
      listingType: filters.listingType === "rent" || filters.listingType === "sale" ? filters.listingType : undefined,
      propertyType: parsePropertyTypeParam(filters.propertyType),
    }),
    getAgentRatingSummary(agent.id),
  ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === agent.id;

  const availableCount = properties.filter((p) => p.status === "available").length;
  const soldCount = properties.filter((p) => p.status === "sold").length;
  const displayName = profile?.full_name || profile?.username || "Agente";
  const milestone = getMilestone(ratingSummary.avg, ratingSummary.count);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <InteractiveBackground />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          {isOwner ? (
            <AvatarUploader userId={agent.id} initialAvatarUrl={profile?.avatar_url ?? null} variant="compact" displayName={displayName} />
          ) : (
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-500 bg-slate-100">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt={displayName} fill className="object-cover" sizes="96px" />
              ) : (
                <User className="text-slate-400" size={40} />
              )}
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-display text-lg font-semibold leading-tight text-prussian">{displayName}</h1>
            {agent.city && (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={12} />
                {agent.city}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Badge tone="success" className="border-emerald-200! bg-emerald-50! text-emerald-700!">
                {availableCount} disponibles
              </Badge>
              <Badge tone="neutral">{soldCount} vendidas</Badge>
              {milestone && (
                <Badge tone="success" className="bg-amber-50 text-amber-700">
                  {milestone.label}
                </Badge>
              )}
            </div>
            {!isOwner && <RateAgentWidget agentId={agent.id} agentSlug={agentSlug} myRating={ratingSummary.myRating} />}
          </div>
        </div>

        {agent.bio && <p className="max-w-3xl text-slate-600">{agent.bio}</p>}

        {!isOwner && (
          <div className="flex justify-center sm:justify-end">
            <ClientRequestTabs agentId={agent.id} />
          </div>
        )}

        <PropertyFilterBar />

        {properties.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-10 text-center text-sm text-slate-500">
            Este agente todavía no tiene propiedades publicadas con esos filtros.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} agentSlug={agentSlug} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
