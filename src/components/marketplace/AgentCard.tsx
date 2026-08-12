import Link from "next/link";
import Image from "next/image";
import { MapPin, User, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { getMilestone } from "@/lib/ratings";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { AgentCardData } from "@/types/domain";

export function AgentCard({ agent, dict }: { agent: AgentCardData; dict: Dictionary["home"]["agentCard"] }) {
  const displayName = agent.profile.full_name || agent.profile.username;
  const milestone = getMilestone(agent.rating_avg, agent.rating_count);

  return (
    <Link href={`/agentes/${agent.slug}`} className="block w-[160px] shrink-0">
      <Card className="group flex h-full flex-col overflow-hidden border-emerald-500! bg-white! text-center hover:border-emerald-600!">
        <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-slate-100">
          {agent.profile.avatar_url ? (
            <Image
              src={agent.profile.avatar_url}
              alt={displayName}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              sizes="160px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="text-slate-400" size={24} />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-1.5 p-2.5">
          <div>
            <h3 className="flex items-center justify-center gap-1 font-display text-xs font-semibold text-prussian">
              <span className="truncate">{displayName}</span>
              <BadgeCheck size={13} className="shrink-0 fill-emerald-600 text-white" />
            </h3>
            {agent.city && (
              <p className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
                <MapPin size={10} />
                {agent.city}
              </p>
            )}
          </div>

          <StarRating value={agent.rating_avg} count={agent.rating_count} size={10} />

          {milestone && (
            <Badge tone="success" className="bg-amber-50 text-amber-700">
              {milestone.label}
            </Badge>
          )}

          {agent.bio && <p className="line-clamp-2 text-[11px] text-slate-500">{agent.bio}</p>}

          <div className="mt-auto flex flex-wrap items-center justify-center gap-1 pt-1">
            <Badge tone="success" className="border-emerald-200! bg-emerald-50! text-emerald-700!">
              {agent.available_count} {dict.available}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
