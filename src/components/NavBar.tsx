import Link from "next/link";
import { LayoutDashboard, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/locale";
import { LogoutButton } from "@/components/LogoutButton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { TermsModal } from "@/components/legal/TermsModal";

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
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center">
            <span className="font-display text-5xl uppercase tracking-tight text-white">AGENTIA</span>
          </Link>

          <nav className="flex items-center gap-4 font-display sm:gap-6">
            <Link
              href="/que-es-agentia"
              className="hidden text-sm font-medium text-white/90 transition-colors hover:text-white sm:block"
            >
              ¿Qué es Agentia?
            </Link>

            <a
              href="https://chat.whatsapp.com/BahpSvfmwIGLj7fSkAGijz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#25D366] bg-black px-3 text-sm font-medium text-[#25D366] shadow-[0_0_8px_rgba(37,211,102,0.7),0_0_16px_rgba(37,211,102,0.4)] transition-all hover:shadow-[0_0_12px_rgba(37,211,102,0.9),0_0_28px_rgba(37,211,102,0.6)] sm:px-4"
            >
              <MessageCircle size={16} />
              <span className="hidden sm:inline">Comunidad WhatsApp</span>
            </a>

            <LanguageToggle locale={locale} />

            {user && role === "agent" && (
              <Link
                href="/panel"
                className="hidden items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white sm:flex"
              >
                <LayoutDashboard size={16} />
                {dict.nav.panel}
              </Link>
            )}

            {user && role === "user" && (
              <Link
                href="/panel-afiliado"
                className="hidden items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white sm:flex"
              >
                <LayoutDashboard size={16} />
                {dict.nav.affiliatePanel}
              </Link>
            )}

            {!user && (
              <div className="flex items-center gap-4">
                <Link
                  href="/ingresar"
                  className="text-sm font-medium text-white/90 transition-colors hover:text-white"
                >
                  {dict.nav.login}
                </Link>
                <Link
                  href="/registro"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  {dict.nav.signup}
                </Link>
              </div>
            )}

            {user && <LogoutButton locale={locale} />}
          </nav>
        </div>
      </header>
    </>
  );
}
