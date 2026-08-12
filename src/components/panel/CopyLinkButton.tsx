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
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? copy.affiliatePanel.linkCopied : copy.affiliatePanel.copyLink}
    </button>
  );
}
