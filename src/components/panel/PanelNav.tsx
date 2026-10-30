"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
  X,
  Bell,
  FileSignature,
  LayoutDashboard,
  Globe,
  Crown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { markSectionSeen, markAffiliateSectionSeen } from "@/lib/actions/panelNotifications";
import type { AffiliateSectionView, PanelSection, PanelSectionView } from "@/types/domain";

const agentNavItems: { href: string; label: string; icon: typeof Home; notifyKey?: PanelSection; dataTour?: string }[] = [
  { href: "/panel", label: copy.panel.overview, icon: Home },
  { href: "/panel/propiedades", label: copy.panel.properties, icon: Building2 },
  { href: "/panel/redes-sociales", label: "Redes Sociales", icon: Link2 },
  { href: "/panel/leads", label: copy.panel.leads, icon: Users, notifyKey: "leads" },
  { href: "/panel/solicitudes", label: copy.panel.solicitudes, icon: Inbox, notifyKey: "solicitudes" },
  { href: "/panel/chats", label: copy.panel.chats, icon: MessageCircle, notifyKey: "chats" },
  {
    href: "/panel/agendamientos",
    label: copy.panel.agendamientos,
    icon: CalendarClock,
    notifyKey: "agendamientos",
    dataTour: "tour-agendamientos",
  },
  { href: "/panel/acuerdos", label: "Acuerdo Privado", icon: FileSignature, notifyKey: "acuerdos" },
  { href: "/panel/avisos", label: copy.panel.avisos, icon: Bell, notifyKey: "avisos" },
  { href: "/panel/mls", label: "MLS", icon: Globe },
  { href: "/panel/suscripcion", label: copy.panel.subscription, icon: CreditCard },
  { href: "/panel/vista-global", label: copy.panel.vistaGlobal, icon: LayoutDashboard },
  { href: "/panel/perfil", label: copy.profile.title, icon: UserRound, dataTour: "tour-perfil" },
];

const affiliateNavItems: { href: string; label: string; icon: typeof Home; notifyKey?: PanelSection; dataTour?: string }[] = [
  { href: "/panel-afiliado", label: copy.affiliatePanel.overview, icon: Home, notifyKey: "resumen" },
  { href: "/panel-afiliado/enlaces", label: copy.affiliatePanel.myLinks, icon: Link2 },
  { href: "/panel-afiliado/avisos", label: copy.affiliatePanel.avisos, icon: Bell, notifyKey: "avisos" },
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

  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  // Sliding active-item pill, same measure-and-translate technique as the
  // mockups' `movePill()`.
  useLayoutEffect(() => {
    function movePill() {
      const list = listRef.current;
      const pill = pillRef.current;
      if (!list || !pill) return;
      const active = list.querySelector<HTMLElement>('a[data-active="true"]');
      if (!active) {
        pill.style.opacity = "0";
        return;
      }
      pill.style.opacity = "1";
      pill.style.transform = `translateY(${active.offsetTop}px)`;
      pill.style.height = `${active.offsetHeight}px`;
    }
    movePill();
    window.addEventListener("resize", movePill);
    return () => window.removeEventListener("resize", movePill);
  }, [pathname, open]);

  function handleClick(notifyKey?: PanelSection) {
    setOpen(false);
    if (notifyKey && notifications?.[notifyKey] && !cleared.has(notifyKey)) {
      setCleared((prev) => new Set(prev).add(notifyKey));
      if (variant === "agent") {
        void markSectionSeen(notifyKey as PanelSectionView["section"]);
      } else {
        void markAffiliateSectionSeen(notifyKey as AffiliateSectionView["section"]);
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-tour="tour-panel-nav-mobile"
        aria-label={open ? "Cerrar menú" : current?.label ?? "Abrir menú"}
        aria-expanded={open}
        className="flex h-11 items-center gap-2.5 rounded-[13px] border border-[var(--line)] bg-[var(--ink-2)] px-3.5 text-sm font-semibold text-white lg:hidden"
      >
        {open ? <X size={19} /> : <Menu size={19} />}
        {current?.label ?? "Menú"}
      </button>

      {/* On mobile the list opens right below the toggle (not over it), so the
          button stays visible and tapping it again closes the menu. */}
      <div className={cn("lg:sticky lg:top-6 lg:block", open ? "mt-2 block" : "hidden")}>
        <div className="flex flex-col gap-1 rounded-2xl border border-[var(--line)] bg-[var(--ink-2)]/95 p-4 backdrop-blur-md">
          <div ref={listRef} className="relative flex flex-col gap-0.5">
            <div
              ref={pillRef}
              className="absolute inset-x-0 top-0 h-[42px] rounded-[13px] bg-gradient-to-r from-[#0a8f5c] to-[#0b7a50] opacity-0 shadow-[0_10px_30px_-12px_var(--em-glow)] transition-[transform,opacity] duration-300"
            />
            {navItems.map((item) => {
              const isActive = item.href === pathname;
              const showDot = Boolean(item.notifyKey && notifications?.[item.notifyKey] && !cleared.has(item.notifyKey));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={isActive}
                  onClick={() => handleClick(item.notifyKey)}
                  data-tour={item.dataTour}
                  className={cn(
                    "relative z-10 flex h-[42px] shrink-0 items-center gap-3 rounded-[13px] px-3.5 text-[14.5px] font-medium transition-colors",
                    isActive ? "text-white font-semibold" : "text-[#bdbdbd] hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <span className="relative flex items-center">
                    <item.icon size={17} className={isActive ? "text-white" : "text-[#8a8a8a]"} />
                    {showDot && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--em-2)] ring-2 ring-[var(--ink-2)]" />
                    )}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {variant === "agent" && (
            <Link
              href="/panel/suscripcion"
              className="mt-3 rounded-[18px] border border-[#13c47f33] bg-gradient-to-br from-[#0a8f5c33] to-white/[0.02] p-4"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <Crown size={17} className="text-[var(--em-2)]" />
                Pasate a Pro
              </span>
              <p className="mt-1.5 text-[12.5px] text-[#a9b8b1]">Estadísticas avanzadas, propiedades ilimitadas y reportes en PDF.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--em-2)]">
                Ver plan Pro <ArrowRight size={15} />
              </span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
