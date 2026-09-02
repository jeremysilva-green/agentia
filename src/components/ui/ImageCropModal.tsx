"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

async function getCroppedImageBlob(imageSrc: string, cropArea: Area): Promise<Blob> {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen."))),
      "image/jpeg",
      0.92
    );
  });
}

export function ImageCropModal({
  imageSrc,
  cropShape = "round",
  onCancel,
  onCropped,
}: {
  imageSrc: string;
  cropShape?: "round" | "rect";
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  async function handleSave() {
    if (!croppedArea) return;
    setError(null);
    setIsProcessing(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedArea);
      onCropped(blob);
    } catch {
      setError("No se pudo procesar la imagen.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-900">Ajustá la imagen</h2>

        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-slate-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="accent-emerald-600"
          aria-label="Zoom"
        />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || !croppedArea}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {isProcessing ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
