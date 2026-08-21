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
  Link2,
  UserRound,
  Menu,
  ChevronDown,
  Bell,
  FileSignature,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { markSectionSeen } from "@/lib/actions/panelNotifications";
import type { PanelSection } from "@/types/domain";

const agentNavItems: { href: string; label: string; icon: typeof Home; notifyKey?: PanelSection }[] = [
  { href: "/panel", label: copy.panel.overview, icon: Home },
  { href: "/panel/propiedades", label: copy.panel.properties, icon: Building2 },
  { href: "/panel/leads", label: copy.panel.leads, icon: Users, notifyKey: "leads" },
  { href: "/panel/solicitudes", label: copy.panel.solicitudes, icon: Inbox, notifyKey: "solicitudes" },
  { href: "/panel/chats", label: copy.panel.chats, icon: MessageCircle, notifyKey: "chats" },
  { href: "/panel/agendamientos", label: copy.panel.agendamientos, icon: CalendarClock, notifyKey: "agendamientos" },
  { href: "/panel/acuerdos", label: "Acuerdo Privado", icon: FileSignature, notifyKey: "acuerdos" },
  { href: "/panel/suscripcion", label: copy.panel.subscription, icon: CreditCard },
  { href: "/panel/vista-global", label: copy.panel.vistaGlobal, icon: LayoutDashboard },
  { href: "/panel/perfil", label: copy.profile.title, icon: UserRound },
];

const affiliateNavItems: { href: string; label: string; icon: typeof Home; notifyKey?: PanelSection }[] = [
  { href: "/panel-afiliado", label: copy.affiliatePanel.overview, icon: Home },
  { href: "/panel-afiliado/enlaces", label: copy.affiliatePanel.myLinks, icon: Link2 },
  { href: "/panel-afiliado/avisos", label: copy.affiliatePanel.avisos, icon: Bell },
  { href: "/panel-afiliado/perfil", label: copy.profile.title, icon: UserRound },
];

export function PanelNav({
  variant,
  notifications,
}: {
  variant: "agent" | "affiliate";
  notifications?: Partial<Record<PanelSection, boolean>>;
}) {
  const navItems = variant === "agent" ? agentNavItems : affiliateNavItems;
  const [open, setOpen] = useState(false);
  const [cleared, setCleared] = useState<Set<PanelSection>>(new Set());
  const pathname = usePathname();
  const current = navItems.find((item) => item.href === pathname);

  function handleClick(notifyKey?: PanelSection) {
    setOpen(false);
    if (notifyKey && notifications?.[notifyKey] && !cleared.has(notifyKey)) {
      setCleared((prev) => new Set(prev).add(notifyKey));
      void markSectionSeen(notifyKey);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-medium text-white backdrop-blur-md lg:hidden"
      >
        <span className="flex items-center gap-2">
          <Menu size={17} />
          {current?.label ?? "Menú"}
        </span>
        <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      <nav
        className={cn(
          "flex-col gap-1 lg:flex lg:border-none lg:bg-transparent lg:p-0 lg:backdrop-blur-none",
          open
            ? "mt-1 flex rounded-xl border border-white/15 bg-white/10 p-1.5 backdrop-blur-md"
            : "hidden"
        )}
      >
        {navItems.map((item) => {
          const showDot = Boolean(item.notifyKey && notifications?.[item.notifyKey] && !cleared.has(item.notifyKey));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleClick(item.notifyKey)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                item.href === pathname
                  ? "bg-emerald-900 text-emerald-400"
                  : "text-white/70 hover:bg-neutral-800 hover:text-white"
              )}
            >
              <span className="relative flex items-center">
                <item.icon size={17} />
                {showDot && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-prussian" />
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
