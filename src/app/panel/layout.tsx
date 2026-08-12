import Link from "next/link";
import { redirect } from "next/navigation";
import { Home, Building2, Users, CreditCard, MessageCircle, Inbox, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { copy } from "@/lib/copy";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar?next=/panel");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "agent") redirect("/");

  const navItems = [
    { href: "/panel", label: copy.panel.overview, icon: Home },
    { href: "/panel/propiedades", label: copy.panel.properties, icon: Building2 },
    { href: "/panel/leads", label: copy.panel.leads, icon: Users },
    { href: "/panel/solicitudes", label: copy.panel.solicitudes, icon: Inbox },
    { href: "/panel/chats", label: copy.panel.chats, icon: MessageCircle },
    { href: "/panel/agendamientos", label: copy.panel.agendamientos, icon: CalendarClock },
    { href: "/panel/suscripcion", label: copy.panel.subscription, icon: CreditCard },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />
      <div className="font-display-light relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
