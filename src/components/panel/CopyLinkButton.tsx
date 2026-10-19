"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { copy } from "@/lib/copy";

// `dark` is purely additive — existing callers that don't pass it keep the
// default light look (e.g. the affiliate panel's AffiliateLinksTable).
export function CopyLinkButton({ url, dark }: { url: string; dark?: boolean }) {
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
      className={
        dark
          ? "inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] text-[#cfcfcf] hover:border-[var(--em)] hover:text-[var(--em-2)]"
          : "inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
      }
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}
