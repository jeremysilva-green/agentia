"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

// For anonymous/non-affiliate visitors — ShareButton (role "user") and
// AgentShareButton (owner) both generate a tracked /s/ or /sa/ short link via
// a server action; this one has nothing to attribute, so it just shares or
// copies the plain canonical URL. No server round-trip needed.
export function PublicShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled the native share sheet — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard unavailable — nothing further we can do here
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full border-white/15! bg-white/5! text-white! hover:border-emerald-400! hover:text-emerald-300!"
      onClick={handleShare}
    >
      {copied ? <Check size={18} /> : <Share2 size={18} />}
      {copied ? "¡Enlace copiado!" : "Compartir"}
    </Button>
  );
}
