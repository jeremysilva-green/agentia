"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { LINK_COPIED_EVENT } from "@/components/property/GenerateLinkButton";

// Mounted once by PropertyGrid; listens for the window event every dark
// GenerateLinkButton instance fires on a successful copy.
export function CopyToast() {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleCopied() {
      setShow(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShow(false), 2800);
    }
    window.addEventListener(LINK_COPIED_EVENT, handleCopied);
    return () => {
      window.removeEventListener(LINK_COPIED_EVENT, handleCopied);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="market-toast-in fixed bottom-7 left-1/2 z-[90] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2.5 rounded-2xl bg-white px-4 py-3 text-[#0e0e0e] shadow-[0_20px_40px_-12px_#000]">
      <Check size={18} className="shrink-0 text-[var(--em)]" />
      <div>
        <span className="block text-sm font-semibold">Link de afiliado copiado</span>
        <span className="block text-[12.5px] text-[#555]">Ganás una comisión si la propiedad se vende por tu link.</span>
      </div>
    </div>
  );
}
