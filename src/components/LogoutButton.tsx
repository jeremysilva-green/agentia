"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";

export function LogoutButton({
  locale = "es",
  className,
  iconSize = 16,
  // Called synchronously on click, before the async sign-out kicks off —
  // lets a caller (e.g. NavMenu) close its own dropdown immediately instead
  // of waiting on the network round-trip.
  onClick,
}: {
  locale?: Locale;
  className?: string;
  iconSize?: number;
  onClick?: () => void;
}) {
  const router = useRouter();

  async function handleLogout() {
    onClick?.();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white",
        className
      )}
    >
      <LogOut size={iconSize} />
      <span>{dictionaries[locale].nav.logout}</span>
    </button>
  );
}
