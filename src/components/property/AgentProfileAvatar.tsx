"use client";

import { useState } from "react";
import Image from "next/image";
import { User, RefreshCw } from "lucide-react";

// Shown to portfolio VISITORS (the owner gets AvatarUploader instead, for
// editing). On mobile there's no room to show the logo separately
// alongside the profile photo, so tapping the same box flips between the
// two instead — the small corner icon hints it's tappable.
export function AgentProfileAvatar({
  avatarUrl,
  logoUrl,
  displayName,
}: {
  avatarUrl: string | null;
  logoUrl: string | null;
  displayName: string;
}) {
  const [showLogo, setShowLogo] = useState(false);
  const hasLogo = Boolean(logoUrl);
  const showingLogo = showLogo && hasLogo;

  return (
    <button
      type="button"
      onClick={hasLogo ? () => setShowLogo((v) => !v) : undefined}
      className={`relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-500 bg-slate-100 ${
        hasLogo ? "cursor-pointer" : "cursor-default"
      }`}
      aria-label={hasLogo ? (showingLogo ? "Ver foto de perfil" : "Ver logo del agente") : undefined}
    >
      {showingLogo && logoUrl ? (
        <Image src={logoUrl} alt={`Logo de ${displayName}`} fill className="object-cover" sizes="96px" />
      ) : avatarUrl ? (
        <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="96px" />
      ) : (
        <User className="text-slate-400" size={40} />
      )}
      {hasLogo && (
        <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white">
          <RefreshCw size={11} />
        </span>
      )}
    </button>
  );
}
