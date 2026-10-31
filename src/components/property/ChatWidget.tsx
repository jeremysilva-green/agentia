"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy";

type ChatMessage = { role: "user" | "assistant"; text: string };

const MIN_REPLY_DELAY_MS = 5000;
const MAX_REPLY_DELAY_MS = 8000;
const AUTO_CLOSE_INACTIVITY_MS = 5 * 60 * 1000;

function splitReplyIntoChunks(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  refCode,
}: {
  propertyId: string;
  agentName: string;
  refCode?: string;
}) {
  const firstName = agentName.trim().split(/\s+/)[0] || agentName;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: "assistant", text: copy.chat.greeting(firstName) },
  ]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  // Auto-closes the widget after a few minutes of no activity — resets on
  // every new message (sent or received), not just on open. Doesn't touch
  // the conversation data, so reopening picks up right where it left off.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setOpen(false), AUTO_CLOSE_INACTIVITY_MS);
    return () => clearTimeout(timer);
  }, [open, messages]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isPending) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, visitorId: getVisitorId(), message: text, ref: refCode }),
      });
      const data = await res.json();
      const chunks = splitReplyIntoChunks(data.reply ?? copy.chat.errorReply);

      // Reveal each chunk as its own bubble with a human-paced "typing" delay
      // in between, instead of dumping the whole reply in one instant block.
      for (const chunk of chunks) {
        await wait(MIN_REPLY_DELAY_MS + Math.random() * (MAX_REPLY_DELAY_MS - MIN_REPLY_DELAY_MS));
        setMessages((prev) => [...prev, { role: "assistant", text: chunk }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: copy.chat.errorReply }]);
    } finally {
      setIsPending(false);
    }
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
        <div className="fixed bottom-4 right-4 z-50 flex h-[min(560px,80vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#13c47f]/30 bg-[#08110d] shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2.5 border-b border-[#13c47f]/20 bg-gradient-to-r from-[#0a3d2a] to-[#0a8f5c] px-4 py-3 text-white">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#08110d] ring-2 ring-[#13c47f]/60">
              <Image src="/agentia-icon.png" alt="Agentia" fill className="object-cover" sizes="36px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-medium leading-tight text-white">
                {copy.chat.assistantLabel(firstName)}
              </p>
              <p className="flex items-center gap-1.5 text-[11px] leading-tight text-emerald-100/80">
                <span className="h-1.5 w-1.5 rounded-full bg-[#13c47f]" />
                Agentia
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#08110d] p-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                  message.role === "user"
                    ? "self-end rounded-br-md bg-gradient-to-br from-[#13c47f] to-[#0a8f5c] text-white"
                    : "self-start rounded-bl-md border border-white/10 bg-white/[0.07] text-slate-100"
                }`}
              >
                {message.text}
              </div>
            ))}
            {isPending && (
              <div className="self-start rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-emerald-300">
                {copy.chat.typing}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/10 bg-[#0b1813] p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={copy.chat.inputPlaceholder}
              className="h-9 flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#13c47f]"
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#13c47f] text-[#04140d] transition-colors hover:bg-[#2ee09a] disabled:cursor-default disabled:hover:bg-[#13c47f]"
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
