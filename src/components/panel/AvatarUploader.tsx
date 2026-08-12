"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AvatarUploader({
  userId,
  initialAvatarUrl,
  variant = "panel",
  displayName,
}: {
  userId: string;
  initialAvatarUrl: string | null;
  variant?: "panel" | "compact";
  displayName?: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    startTransition(async () => {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
      });
      if (uploadError) {
        setError("No se pudo subir la imagen.");
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", userId);

      if (updateError) {
        setError("No se pudo guardar la foto de perfil.");
        return;
      }

      setAvatarUrl(data.publicUrl);
    });
  }

  const input = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => handleFile(e.target.files?.[0])}
    />
  );

  if (variant === "compact") {
    return (
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 disabled:opacity-60"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName ?? "Foto de perfil"} fill className="object-cover" sizes="96px" />
          ) : (
            <User className="text-slate-400" size={40} />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
            <Camera size={20} />
          </span>
          {isPending && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
              Subiendo...
            </span>
          )}
        </button>
        {input}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Foto de perfil" fill className="object-cover" sizes="80px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <User size={28} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {input}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <Camera size={14} />
          {isPending ? "Subiendo..." : "Cambiar foto"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
