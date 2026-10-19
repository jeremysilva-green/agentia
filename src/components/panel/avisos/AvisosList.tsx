"use client";

import { useState, useTransition } from "react";
import { Bell, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { markMlsAvisoRead } from "@/lib/actions/mlsNotices";
import { EmptyState } from "@/components/panel/theme/EmptyState";
import type { MlsNotice } from "@/lib/data/mlsNotices";

const dateFmt = (value: string) =>
  new Date(value).toLocaleString("es-PY", { dateStyle: "long", timeStyle: "short" });

function AvisosIllustration() {
  return (
    <div className="relative h-[110px] w-[150px]">
      <span className="panel-illo-ring" />
      <span className="panel-illo-ring d2" />
      <div className="panel-swing absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Bell size={44} strokeWidth={1.4} className="text-[#333]" />
        <span className="absolute top-[35px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--em-2)]" />
      </div>
    </div>
  );
}

export function AvisosList({ notices }: { notices: MlsNotice[] }) {
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(notices.filter((n) => n.read_at).map((n) => n.id))
  );
  const [, startTransition] = useTransition();

  if (notices.length === 0) {
    return (
      <EmptyState
        illustration={<AvisosIllustration />}
        message={copy.mls.avisosEmpty}
        hint="Acá vas a ver novedades de tus propiedades, compradores, visitas y cierres."
      />
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
              isUnread ? "border-[#13c47f66] bg-[#0A8F5C1a]" : "border-[var(--line)] bg-[var(--ink-2)]"
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  isUnread ? "bg-[#13c47f26] text-[var(--em-2)]" : "bg-white/10 text-[var(--muted)]"
                )}
              >
                <Bell size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">{notice.title}</p>
                  {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-[var(--em-2)]" />}
                </div>
                <p className="mt-1 text-[#cfcfcf]">{notice.body}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{dateFmt(notice.event_at)}</p>
              </div>
            </div>

            <a
              href={`/api/mls/notices/${notice.id}/comprobante`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-medium text-[#d5d5d5] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
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
