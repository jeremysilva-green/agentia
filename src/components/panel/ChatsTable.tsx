"use client";

import { useState } from "react";
import { X } from "lucide-react";
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

function dateFmt(value: string) {
  return new Date(value).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatsTable({ rows }: { rows: AgentChatRow[] }) {
  const [viewing, setViewing] = useState<AgentChatRow | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {copy.panel.chatsEmpty}
      </div>
    );
  }

  const transcript = viewing
    ? ((viewing.messages as unknown as StoredMessage[]) ?? [])
        .map((message) => ({ role: message.role, text: extractDisplayText(message.content) }))
        .filter((message) => message.text)
    : [];

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.chatLead}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.affiliatePanel.property}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.chatDate}</th>
              <th className="px-4 py-3 font-medium">{copy.panel.chatSummary}</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-medium text-slate-900">{row.buyer_name ?? copy.panel.anonymousVisitor}</p>
                  {row.buyer_phone && <p className="text-slate-500">{row.buyer_phone}</p>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.property_title}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{dateFmt(row.updated_at)}</td>
                <td className="px-4 py-3 text-slate-600">
                  <p className="line-clamp-2 max-w-xs">{row.summary ?? "—"}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setViewing(row)}
                    className="font-medium text-emerald-700 hover:underline"
                  >
                    {copy.panel.viewConversation}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="flex h-[min(560px,80vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {viewing.buyer_name ?? copy.panel.anonymousVisitor}
                </p>
                <p className="text-xs text-slate-500">{viewing.property_title}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
              {transcript.map((message, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "self-start bg-slate-100 text-slate-700"
                      : "self-end bg-emerald-600 text-white"
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
