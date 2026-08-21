import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/locale";
import { LogoutButton } from "@/components/LogoutButton";
import { TermsModal } from "@/components/legal/TermsModal";
import { NavMenu } from "@/components/NavMenu";

export async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { locale, dict } = await getDictionary();

  let role: "agent" | "user" | null = null;
  let termsAccepted = true;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, terms_accepted_at")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
    termsAccepted = Boolean(profile?.terms_accepted_at);
  }

  return (
    <>
      {role && !termsAccepted && <TermsModal role={role === "agent" ? "agent" : "affiliate"} />}
      <header className="bg-prussian">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-8">
          <Link href="/" className="flex items-center">
            <span className="font-display text-2xl uppercase tracking-tight text-white sm:text-5xl">AGENTIA</span>
          </Link>

          <nav className="flex items-center gap-2.5 font-display print:hidden sm:gap-6">
            <Link
              href="/inicio"
              className="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Inicio
            </Link>

            {user && role === "agent" && (
              <Link
                href="/panel"
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
              >
                <LayoutDashboard size={16} />
                {dict.nav.panel}
              </Link>
            )}

            {user && role === "user" && (
              <Link
                href="/panel-afiliado"
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
              >
                <LayoutDashboard size={16} />
                {dict.nav.affiliatePanel}
              </Link>
            )}

            {!user && (
              <div className="flex items-center gap-2.5 sm:gap-4">
                <Link
                  href="/ingresar"
                  className="text-sm font-medium text-white/90 transition-colors hover:text-white"
                >
                  {dict.nav.login}
                </Link>
                <Link
                  href="/registro"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 sm:h-10 sm:px-4"
                >
                  {dict.nav.signup}
                </Link>
              </div>
            )}

            {user && <LogoutButton locale={locale} />}

            <NavMenu />
          </nav>
        </div>
      </header>
    </>
  );
}
