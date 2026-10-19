import { PanelBadge } from "@/components/panel/theme/PanelBadge";
import { copy } from "@/lib/copy";

type Status = "pending" | "trialing" | "active" | "past_due" | "canceled" | null | undefined;

const toneByStatus = {
  pending: "amber",
  trialing: "emerald",
  active: "emerald",
  past_due: "red",
  canceled: "neutral",
} as const;

const labelByStatus: Record<string, string> = {
  pending: copy.panel.statusPending,
  trialing: copy.panel.statusTrialing,
  active: copy.panel.statusActive,
  past_due: copy.panel.statusPastDue,
  canceled: copy.panel.statusCanceled,
};

export function SubscriptionStatusBadge({ status }: { status: Status }) {
  const key = status ?? "pending";
  const tone = toneByStatus[key as keyof typeof toneByStatus] ?? "neutral";
  return (
    <PanelBadge tone={tone}>
      {(key === "active" || key === "trialing") && <span className="panel-pulse-dot" />}
      {labelByStatus[key]}
    </PanelBadge>
  );
}
