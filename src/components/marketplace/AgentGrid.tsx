"use client";

import { useState } from "react";
import { AgentCard } from "@/components/marketplace/AgentCard";
import type { AgentCardData } from "@/types/domain";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const PAGE_SIZE = 20;

export function AgentGrid({
  agents,
  dict,
  emptyMessage,
}: {
  agents: AgentCardData[];
  dict: Dictionary["home"]["agentCard"];
  emptyMessage: string;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (agents.length === 0) {
    return (
      <p className="w-full rounded-2xl border border-dashed border-slate-300 bg-snow p-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  const visibleAgents = agents.slice(0, visibleCount);
  const hasMore = visibleCount < agents.length;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {visibleAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} dict={dict} />
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Cargar más
        </button>
      )}
    </div>
  );
}
