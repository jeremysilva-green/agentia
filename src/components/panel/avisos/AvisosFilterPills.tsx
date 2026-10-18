import Link from "next/link";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { MlsNoticeFilter } from "@/lib/data/mlsNotices";

const FILTERS: { value: MlsNoticeFilter; label: string }[] = [
  { value: "all", label: copy.mls.avisosFilterAll },
  { value: "listings", label: copy.mls.avisosFilterListings },
  { value: "buyers", label: copy.mls.avisosFilterBuyers },
  { value: "showings", label: copy.mls.avisosFilterShowings },
  { value: "closings", label: copy.mls.avisosFilterClosings },
  { value: "no_leidos", label: copy.mls.avisosFilterUnread },
];

export function AvisosFilterPills({ current }: { current: MlsNoticeFilter }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <Link
          key={f.value}
          href={f.value === "all" ? "/panel/avisos" : `/panel/avisos?filter=${f.value}`}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            current === f.value
              ? "border-emerald-500 bg-emerald-900 text-emerald-400"
              : "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
          )}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}
