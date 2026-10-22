"use client";

import { useState, useTransition } from "react";
import { Bell, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { markMlsAvisoRead, deleteMlsNotice } from "@/lib/actions/mlsNotices";
import { EmptyState } from "@/components/panel/theme/EmptyState";
import type { MlsNotice } from "@/lib/data/mlsNotices";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Deliberately not `toLocaleString` — Node's and the browser's Intl/ICU data
// don't always agree on the es-PY date+time combining pattern (comma vs
// "a las"), which causes a hydration mismatch. Manual string building
// sidesteps that, same fix already applied to ChatsTable's timeOnlyFmt.
function dateFmt(value: string) {
  const d = new Date(value);
  const month = MONTH_NAMES[d.getMonth()];
  const hours24 = d.getHours();
  const minutes = d.getMinutes();
  const period = hours24 >= 12 ? "p. m." : "a. m.";
  const hours12 = hours24 % 12 || 12;
  const time = `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
  return `${d.getDate()} de ${month} de ${d.getFullYear()} a las ${time}`;
}

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
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const visibleNotices = notices.filter((n) => !deletedIds.has(n.id));

  if (visibleNotices.length === 0) {
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

  function remove(id: string) {
    setDeletedIds((prev) => new Set(prev).add(id));
    startTransition(() => {
      void deleteMlsNotice(id);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleNotices.map((notice) => {
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

            <div className="flex shrink-0 items-center gap-2 self-start">
              <a
                href={`/api/mls/notices/${notice.id}/comprobante`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-medium text-[#d5d5d5] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
              >
                <Download size={13} />
                {copy.mls.downloadReceipt}
              </a>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(notice.id);
                }}
                aria-label="Eliminar aviso"
                title="Eliminar aviso"
                className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border border-[#ff5a5a33] bg-[#ff5a5a0d] text-[#ff7a7a] transition-colors hover:border-[#ff5a5a] hover:bg-[#ff5a5a] hover:text-white"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
