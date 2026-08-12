"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Building2,
  Users,
  CreditCard,
  MessageCircle,
  Inbox,
  CalendarClock,
  Menu,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";

const navItems = [
  { href: "/panel", label: copy.panel.overview, icon: Home },
  { href: "/panel/propiedades", label: copy.panel.properties, icon: Building2 },
  { href: "/panel/leads", label: copy.panel.leads, icon: Users },
  { href: "/panel/solicitudes", label: copy.panel.solicitudes, icon: Inbox },
  { href: "/panel/chats", label: copy.panel.chats, icon: MessageCircle },
  { href: "/panel/agendamientos", label: copy.panel.agendamientos, icon: CalendarClock },
  { href: "/panel/suscripcion", label: copy.panel.subscription, icon: CreditCard },
];

export function PanelNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = navItems.find((item) => item.href === pathname);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white lg:hidden"
      >
        <span className="flex items-center gap-2">
          <Menu size={17} />
          {current?.label ?? "Menú"}
        </span>
        <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      <nav className={cn("flex-col gap-1 lg:flex", open ? "mt-1 flex" : "hidden")}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              item.href === pathname
                ? "bg-emerald-600/15 text-emerald-400"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <item.icon size={17} />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
