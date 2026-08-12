"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";

export function LogoutButton({ locale = "es" }: { locale?: Locale }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white"
    >
      <LogOut size={16} />
      <span>{dictionaries[locale].nav.logout}</span>
    </button>
  );
}
