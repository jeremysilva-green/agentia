"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAgentSocialShare } from "@/lib/actions/agentSocialShares";

export function DeleteAgentSocialShareButton({ shareId }: { shareId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("¿Eliminar este enlace? Ya no vas a poder rastrear nuevas visitas con él.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAgentSocialShare(shareId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label="Eliminar enlace"
        className="inline-flex items-center justify-center rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        <Trash2 size={13} />
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
