"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { copy } from "@/lib/copy";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? copy.affiliatePanel.linkCopied : copy.affiliatePanel.copyLink}
      aria-label={copied ? copy.affiliatePanel.linkCopied : copy.affiliatePanel.copyLink}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}
