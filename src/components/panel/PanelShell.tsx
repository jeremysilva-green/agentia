"use client";

import { usePathname } from "next/navigation";

// Servicios (and its tools) get the full width: no side menu.
export function PanelShell({ nav, children }: { nav: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/panel/servicios" || pathname.startsWith("/panel/servicios/");

  return (
    <div
      className={`relative z-10 mx-auto flex flex-col gap-6 px-4 py-8 font-sans sm:px-6 ${
        hideNav ? "max-w-6xl" : "max-w-6xl lg:flex-row lg:items-start"
      }`}
    >
      {!hideNav && <aside className="lg:w-[264px] lg:shrink-0">{nav}</aside>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
