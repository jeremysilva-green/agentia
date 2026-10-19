"use client";

import { useState } from "react";
import { X, Ghost, Sparkles, ArrowRight } from "lucide-react";
import { MonthYearAccordion } from "@/components/panel/MonthYearAccordion";
import { EmptyState } from "@/components/panel/theme/EmptyState";
import { copy } from "@/lib/copy";
import type { AgentChatRow } from "@/types/domain";

type StoredBlock = { type: string; text?: string };
type StoredMessage = { role: "user" | "assistant"; content: string | StoredBlock[] };

function extractDisplayText(content: StoredMessage["content"]): string {
  if (typeof content === "string") return content;
  return content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join(" ")
    .trim();
}

function dateOnlyFmt(value: string) {
  return new Date(value).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" });
}

// Deliberately not `toLocaleTimeString` — its AM/PM separator renders with a
// different space character (narrow no-break space) depending on the ICU
// data available to Node vs. the browser's own Intl, which causes a
// server/client hydration mismatch. Plain string building sidesteps that.
function timeOnlyFmt(value: string) {
  const d = new Date(value);
  const hours24 = d.getHours();
  const minutes = d.getMinutes();
  const period = hours24 >= 12 ? "p. m." : "a. m.";
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
}

function ChatAvatar() {
  return (
    <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[#cfcfcf]">
      <Ghost size={18} />
      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--ink-2)] bg-[var(--em-2)]" />
    </span>
  );
}

function ChatSummary({ row }: { row: AgentChatRow }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
      <Sparkles size={14} className="mt-0.5 shrink-0 text-[var(--em-2)]" />
      <p className="line-clamp-2 text-[13px] text-[#bdbdbd]">{row.summary ?? "—"}</p>
    </div>
  );
}

function ChatsForMonth({ rows, onView }: { rows: AgentChatRow[]; onView: (row: AgentChatRow) => void }) {
  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] p-4 text-xs">
            <div className="flex items-start gap-3">
              <ChatAvatar />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{row.buyer_name ?? copy.panel.anonymousVisitor}</p>
                <p className="truncate text-[12.5px] text-[var(--muted)]">
                  {row.buyer_phone ? `Chat web · ${row.buyer_phone}` : "Chat web"}
                </p>
              </div>
              <div className="shrink-0 text-right text-[var(--muted)]">
                <b className="block text-[12px] font-medium whitespace-nowrap text-[#e0e0e0]">{dateOnlyFmt(row.updated_at)}</b>
                <span className="text-[11px] whitespace-nowrap">{timeOnlyFmt(row.updated_at)}</span>
              </div>
            </div>

            <p className="truncate text-[13px] text-[#e6e6e6]">{row.property_title}</p>

            <ChatSummary row={row} />

            <button
              type="button"
              onClick={() => onView(row)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#13c47f55] bg-[#13c47f17] px-3 py-2 text-[13.5px] font-semibold text-[var(--em-2)] transition-colors hover:bg-[var(--em)] hover:text-white"
            >
              {copy.panel.viewConversation}
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] sm:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="border-b border-[var(--line)] bg-white/[0.04] text-[11px] font-bold tracking-wide text-[#8d8d8d] uppercase">
              <tr>
                <th className="w-[20%] px-4 py-3 font-bold">{copy.panel.chatLead}</th>
                <th className="w-[18%] px-4 py-3 font-bold">{copy.affiliatePanel.property}</th>
                <th className="w-[13%] px-4 py-3 font-bold">{copy.panel.chatDate}</th>
                <th className="w-[32%] px-4 py-3 font-bold">{copy.panel.chatSummary}</th>
                <th className="w-[17%] px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {rows.map((row) => (
                <tr key={row.id} className="align-top transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <ChatAvatar />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold break-words text-white">{row.buyer_name ?? copy.panel.anonymousVisitor}</p>
                        <p className="text-[12.5px] break-words text-[var(--muted)]">
                          {row.buyer_phone ? `Chat web · ${row.buyer_phone}` : "Chat web"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[14px] break-words text-[#e6e6e6]">{row.property_title}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    <b className="block text-[13px] font-medium text-[#e0e0e0]">{dateOnlyFmt(row.updated_at)}</b>
                    <span className="text-[12px]">{timeOnlyFmt(row.updated_at)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ChatSummary row={row} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onView(row)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#13c47f55] bg-[#13c47f17] px-3 py-2 text-[13.5px] font-semibold text-[var(--em-2)] transition-colors hover:bg-[var(--em)] hover:text-white"
                    >
                      {copy.panel.viewConversation}
                      <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function ChatsTable({ rows }: { rows: AgentChatRow[] }) {
  const [viewing, setViewing] = useState<AgentChatRow | null>(null);

  if (rows.length === 0) {
    return <EmptyState message={copy.panel.chatsEmpty} />;
  }

  const transcript = viewing
    ? ((viewing.messages as unknown as StoredMessage[]) ?? [])
        .map((message) => ({ role: message.role, text: extractDisplayText(message.content) }))
        .filter((message) => message.text)
    : [];

  return (
    <>
      <MonthYearAccordion rows={rows} getDate={(r) => r.updated_at} renderGroup={(monthRows) => <ChatsForMonth rows={monthRows} onView={setViewing} />} dark />

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewing(null)}>
          <div
            className="flex h-[min(560px,80vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--ink-2)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-b from-[#0A8F5C1a] to-transparent p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[#cfcfcf]">
                <Ghost size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{viewing.buyer_name ?? copy.panel.anonymousVisitor}</p>
                <p className="truncate text-xs text-[var(--muted)]">{viewing.property_title}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="shrink-0 rounded-lg border border-[var(--line)] p-2 text-[var(--muted)] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
              {transcript.map((message, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    message.role === "user"
                      ? "self-start rounded-bl-md bg-white/10 text-[#ededed]"
                      : "self-end rounded-br-md bg-gradient-to-br from-[var(--em-2)] to-[var(--em)] text-white"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
