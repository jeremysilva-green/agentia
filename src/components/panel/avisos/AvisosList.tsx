"use client";

import { useState, useTransition } from "react";
import { Bell, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { markMlsAvisoRead } from "@/lib/actions/mlsNotices";
import type { MlsNotice } from "@/lib/data/mlsNotices";

const dateFmt = (value: string) =>
  new Date(value).toLocaleString("es-PY", { dateStyle: "long", timeStyle: "short" });

export function AvisosList({ notices }: { notices: MlsNotice[] }) {
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(notices.filter((n) => n.read_at).map((n) => n.id))
  );
  const [, startTransition] = useTransition();

  if (notices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-sm text-white/50">
        {copy.mls.avisosEmpty}
      </div>
    );
  }

  function markRead(id: string) {
    if (readIds.has(id)) return;
    setReadIds((prev) => new Set(prev).add(id));
    startTransition(() => {
      void markMlsAvisoRead(id);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {notices.map((notice) => {
        const isUnread = !readIds.has(notice.id);
        return (
          <div
            key={notice.id}
            onClick={() => markRead(notice.id)}
            className={cn(
              "flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 text-sm transition-colors sm:flex-row sm:items-start sm:justify-between",
              isUnread ? "border-emerald-500/40 bg-emerald-950/30" : "border-white/10 bg-white/5"
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  isUnread ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40"
                )}
              >
                <Bell size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">{notice.title}</p>
                  {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                </div>
                <p className="mt-1 text-white/70">{notice.body}</p>
                <p className="mt-1 text-xs text-white/40">{dateFmt(notice.event_at)}</p>
              </div>
            </div>

            <a
              href={`/api/mls/notices/${notice.id}/comprobante`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-emerald-400 hover:text-emerald-400"
            >
              <Download size={13} />
              {copy.mls.downloadReceipt}
            </a>
          </div>
        );
      })}
    </div>
  );
}
