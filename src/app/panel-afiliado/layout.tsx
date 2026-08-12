import Link from "next/link";
import { redirect } from "next/navigation";
import { Home, Link2, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { copy } from "@/lib/copy";

export default async function AffiliatePanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar?next=/panel-afiliado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "user") redirect("/");

  const navItems = [
    { href: "/panel-afiliado", label: copy.affiliatePanel.overview, icon: Home },
    { href: "/panel-afiliado/enlaces", label: copy.affiliatePanel.myLinks, icon: Link2 },
    { href: "/panel-afiliado/perfil", label: copy.profile.title, icon: UserRound },
  ];

  return (
    <div className="font-display-light mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
