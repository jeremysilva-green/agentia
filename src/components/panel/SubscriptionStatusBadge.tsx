import { Badge } from "@/components/ui/Badge";
import { copy } from "@/lib/copy";

type Status = "pending" | "trialing" | "active" | "past_due" | "canceled" | null | undefined;

const toneByStatus = {
  pending: "warning",
  trialing: "success",
  active: "success",
  past_due: "danger",
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
    <Badge tone={tone} className={tone === "success" ? "border-emerald-200! bg-emerald-50! text-emerald-700!" : undefined}>
      {labelByStatus[key]}
    </Badge>
  );
}
