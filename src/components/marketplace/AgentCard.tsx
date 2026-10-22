import Link from "next/link";
import Image from "next/image";
import { MapPin, User, BadgeCheck, ArrowRight } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { AgentCardData } from "@/types/domain";

// The card only shows the agent's first name (their full name is what
// shows on their own portfolio page, via the un-shortened `displayName`
// there) — but even a first name can occasionally run long, so the font
// size still scales down a little rather than risk an ellipsis cutoff.
const NAME_BASE_SIZE = 19;
const NAME_BASE_CHARS = 13;
function nameFontSize(name: string): number {
  if (name.length <= NAME_BASE_CHARS) return NAME_BASE_SIZE;
  return Math.max(12, Math.round((NAME_BASE_SIZE * NAME_BASE_CHARS) / name.length));
}

export function AgentCard({
  agent,
  revealDelay,
}: {
  agent: AgentCardData;
  dict: Dictionary["home"]["agentCard"];
  revealDelay?: number;
}) {
  const displayName = agent.profile.full_name || agent.profile.username;
  const firstName = displayName.trim().split(/\s+/)[0] ?? displayName;

  return (
    <Link
      href={`/agentes/${agent.slug}`}
      style={revealDelay !== undefined ? { animationDelay: `${revealDelay}s` } : undefined}
      className="group market-rv relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--ink-2)] transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-2 hover:border-[#0a8f5c99] hover:shadow-[0_30px_60px_-30px_#000,0_0_0_1px_#0a8f5c33]"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-black/40">
        {agent.profile.avatar_url ? (
          <Image
            src={agent.profile.avatar_url}
            alt={displayName}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(min-width: 1024px) 16vw, (min-width: 768px) 22vw, (min-width: 640px) 30vw, 45vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="text-[var(--muted)]" size={28} />
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "linear-gradient(180deg, transparent 55%, var(--ink-2) 100%)" }}
        />

        {agent.logo_url && (
          <div className="absolute right-2 bottom-2 z-10 grid h-9 w-9 place-items-center overflow-hidden rounded-[11px] border-2 border-[var(--ink-2)] bg-[var(--em)] shadow-[0_8px_20px_-8px_#000]">
            <Image src={agent.logo_url} alt="" fill className="object-cover" sizes="36px" />
          </div>
        )}
      </div>

      <div className="relative z-10 -mt-4.5 flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <h3 className="flex items-center gap-1.5 font-display font-semibold text-white">
            <span className="whitespace-nowrap" style={{ fontSize: nameFontSize(firstName) }}>
              {firstName}
            </span>
            <BadgeCheck size={17} className="shrink-0 fill-[var(--em-2)] text-[var(--ink-2)]" />
          </h3>
          {agent.city && (
            <p className="mt-0.5 flex items-center gap-1 text-[13px] text-[var(--muted)]">
              <MapPin size={14} className="shrink-0 text-[var(--em-2)]" />
              {agent.city}
            </p>
          )}
        </div>

        <StarRating value={agent.rating_avg} count={agent.rating_count} newLabel="Sin reseñas" size={14} dark />

        <span className="mt-auto flex items-center justify-center gap-2 rounded-[13px] border border-[var(--line)] bg-white/[0.06] py-2.5 text-sm font-semibold text-[#e6e6e6] transition-colors group-hover:border-[var(--em)] group-hover:bg-[var(--em)] group-hover:text-white">
          Ver perfil
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
