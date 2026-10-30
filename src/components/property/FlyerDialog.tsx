"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const DEFAULT_COLOR = "#e6b763";

const PRESET_COLORS = [
  { value: "#e6b763", label: "Dorado" },
  { value: "#13c47f", label: "Verde" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#ef4444", label: "Rojo" },
  { value: "#f97316", label: "Naranja" },
  { value: "#a855f7", label: "Violeta" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#ffffff", label: "Blanco" },
];

/**
 * The flyer dialog shared by agents ("Flyer" button) and affiliates ("Generar
 * link"): pick the main color, render the flyer on the server (Satori), try
 * other colors or toggle "Sin Logo" until it looks right, then "Guardar" keeps
 * it and goes to `redirectTo`. Mount it only while open — it starts fresh each time.
 */
export function FlyerDialog({
  propertyId,
  title,
  redirectTo,
  defaultNoLogo = false,
  onClose,
}: {
  propertyId: string;
  title: string;
  redirectTo: string;
  defaultNoLogo?: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [color, setColor] = useState(DEFAULT_COLOR);
  // Color the preview on screen was generated with (null until the first OK).
  const [generatedColor, setGeneratedColor] = useState<string | null>(null);
  // "Sin Logo": hide the corner logo. Like the color, the preview on screen was
  // made with `generatedNoLogo`; changing the toggle needs a Regenerar.
  const [noLogo, setNoLogo] = useState(defaultNoLogo);
  const [generatedNoLogo, setGeneratedNoLogo] = useState(defaultNoLogo);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageUrlRef = useRef<string | null>(null);

  function replaceImage(url: string | null) {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = url;
    setImageUrl(url);
  }

  // Free the blob when the dialog goes away.
  useEffect(
    () => () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    },
    []
  );

  function close() {
    if (generating || saving) return;
    onClose();
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/property-flyer/${propertyId}?color=${encodeURIComponent(color)}&logo=${noLogo ? 0 : 1}`
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "No pudimos crear el flyer. Intentá de nuevo.");
        return;
      }
      // The new render replaces the previous one.
      replaceImage(URL.createObjectURL(await response.blob()));
      setGeneratedColor(color);
      setGeneratedNoLogo(noLogo);
    } catch {
      setError("No pudimos crear el flyer. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!generatedColor) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/property-flyer/${propertyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color: generatedColor, logo: !generatedNoLogo }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "No pudimos guardar el flyer. Intentá de nuevo.");
        setSaving(false);
        return;
      }
      router.push(redirectTo);
    } catch {
      setError("No pudimos guardar el flyer. Revisá tu conexión e intentá de nuevo.");
      setSaving(false);
    }
  }

  const hasPreview = imageUrl !== null;
  const colorChanged = hasPreview && (color !== generatedColor || noLogo !== generatedNoLogo);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        close();
      }}
    >
      <div
        role="dialog"
        aria-label="Crear flyer"
        className={cn(
          "flex max-h-full w-full flex-col gap-4 overflow-y-auto rounded-[22px] border border-white/10 bg-[#151515] p-5",
          hasPreview ? "max-w-md" : "max-w-sm"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Elegí el color principal</h3>
            <p className="mt-0.5 text-xs text-[#9a9a9a]">
              Se aplica a los íconos, líneas y detalles dorados del flyer.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="shrink-0 rounded-lg p-1.5 text-[#9a9a9a] hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              title={preset.label}
              aria-label={preset.label}
              aria-pressed={color === preset.value}
              onClick={() => setColor(preset.value)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110",
                color === preset.value ? "border-white" : "border-white/15"
              )}
              style={{ backgroundColor: preset.value }}
            >
              {color === preset.value && (
                <Check size={14} className={preset.value === "#ffffff" ? "text-black" : "text-white"} />
              )}
            </button>
          ))}
          <label
            title="Otro color"
            className="relative flex h-8 cursor-pointer items-center gap-2 rounded-full border border-white/15 px-2.5 text-xs text-[#d5d5d5] hover:border-white/40"
          >
            <span className="h-4 w-4 rounded-full border border-white/30" style={{ backgroundColor: color }} />
            Otro
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Elegir otro color"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={noLogo}
          onClick={() => setNoLogo((value) => !value)}
          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-left text-sm text-[#e4e4e4] hover:border-white/25"
        >
          Sin Logo
          <span
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors",
              noLogo ? "bg-[#0a8f5c]" : "bg-white/20"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                noLogo ? "left-[18px]" : "left-0.5"
              )}
            />
          </span>
        </button>

        {hasPreview && (
          <div className="relative overflow-hidden rounded-xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`Flyer de ${title}`}
              className={cn("mx-auto block max-h-[60vh] w-auto max-w-full", generating && "opacity-40")}
            />
            {generating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-white" />
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {!hasPreview ? (
          <Button
            type="button"
            size="md"
            onClick={generate}
            disabled={generating}
            className="w-full bg-[#0a8f5c]! text-white! hover:bg-[#13c47f]! disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creando flyer...
              </>
            ) : (
              "OK"
            )}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="md"
              variant="secondary"
              onClick={generate}
              disabled={generating || saving || !colorChanged}
              className="border-white/15! bg-white/[0.05]! text-white! hover:bg-white/10!"
            >
              <RefreshCw size={15} className={generating ? "animate-spin" : undefined} />
              {generating ? "Creando..." : "Regenerar"}
            </Button>
            <Button
              type="button"
              size="md"
              onClick={save}
              disabled={generating || saving || colorChanged}
              className="bg-[#0a8f5c]! text-white! hover:bg-[#13c47f]! disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        )}
        {hasPreview && colorChanged && !generating && (
          <p className="-mt-2 text-center text-xs text-[#9a9a9a]">
            Cambiaste una opción: tocá &quot;Regenerar&quot; para verla en el flyer.
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
