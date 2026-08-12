"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { approveClientRequest, rejectClientRequest } from "@/lib/actions/clientRequests";
import { copy } from "@/lib/copy";

export function ClientRequestActions({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);

  function handle(action: "approve" | "reject") {
    setError(null);
    setPendingAction(action);
    startTransition(async () => {
      const result = action === "approve" ? await approveClientRequest(requestId) : await rejectClientRequest(requestId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex gap-1.5">
        <Button
          type="button"
          size="sm"
          className="whitespace-nowrap text-xs"
          disabled={isPending}
          onClick={() => handle("approve")}
        >
          <Check size={13} />
          {isPending && pendingAction === "approve" ? "..." : copy.panel.solicitudesApprove}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="whitespace-nowrap text-xs"
          disabled={isPending}
          onClick={() => handle("reject")}
        >
          <X size={13} />
          {isPending && pendingAction === "reject" ? "..." : copy.panel.solicitudesReject}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
