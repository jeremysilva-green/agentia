"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { X, Send, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy";

type ChatMessage = { role: "user" | "assistant"; text: string };

function getVisitorId() {
  if (typeof window === "undefined") return "";
  const key = "agently_chat_visitor";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}

export function ChatWidget({
  propertyId,
  agentName,
  agentAvatarUrl,
  refCode,
}: {
  propertyId: string;
  agentName: string;
  agentAvatarUrl: string | null;
  refCode?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: "assistant", text: copy.chat.greeting(agentName) },
  ]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isPending) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsPending(true);

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, visitorId: getVisitorId(), message: text, ref: refCode }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages((prev) => [...prev, { role: "assistant", text: data.reply ?? copy.chat.errorReply }]);
      })
      .catch(() => {
        setMessages((prev) => [...prev, { role: "assistant", text: copy.chat.errorReply }]);
      })
      .finally(() => setIsPending(false));
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="w-full bg-emerald-600! font-display text-white! hover:bg-emerald-700!"
        onClick={() => setOpen(true)}
      >
        {copy.property.contactWhatsapp}
      </Button>

      {open && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[min(560px,80vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-emerald-500 bg-emerald-50 shadow-2xl">
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-emerald-600 px-4 py-3 text-white">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/20">
              {agentAvatarUrl ? (
                <Image src={agentAvatarUrl} alt={agentName} fill className="object-cover" sizes="32px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User size={16} />
                </div>
              )}
            </div>
            <p className="flex-1 truncate font-display text-sm font-medium text-white">{agentName}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/80 transition-colors hover:text-white"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "self-end bg-prussian text-white"
                    : "self-start bg-emerald-600 text-white"
                }`}
              >
                {message.text}
              </div>
            ))}
            {isPending && (
              <div className="self-start rounded-2xl bg-emerald-600 px-3 py-2 text-sm text-emerald-100">
                {copy.chat.typing}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-emerald-100 bg-emerald-50 p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={copy.chat.inputPlaceholder}
              className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              aria-label={copy.chat.send}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
