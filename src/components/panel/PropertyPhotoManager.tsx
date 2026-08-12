"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Star, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { PropertyImage } from "@/types/domain";

export function PropertyPhotoManager({
  propertyId,
  agentId,
  initialImages,
}: {
  propertyId: string;
  agentId: string;
  initialImages: PropertyImage[];
}) {
  const [images, setImages] = useState(
    [...initialImages].sort((a, b) => a.position - b.position)
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  function publicUrl(storagePath: string) {
    return supabase.storage.from("property-photos").getPublicUrl(storagePath).data.publicUrl;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    startTransition(async () => {
      let nextPosition = images.length === 0 ? 0 : Math.max(...images.map((i) => i.position)) + 1;

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${agentId}/${propertyId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("property-photos")
          .upload(path, file);

        if (uploadError) {
          setError("No se pudo subir una de las imágenes.");
          continue;
        }

        const { data, error: insertError } = await supabase
          .from("property_images")
          .insert({ property_id: propertyId, storage_path: path, position: nextPosition })
          .select("*")
          .single();

        if (insertError || !data) {
          setError("No se pudo guardar una de las imágenes.");
          continue;
        }

        nextPosition += 1;
        setImages((prev) => [...prev, data]);
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  async function handleDelete(image: PropertyImage) {
    startTransition(async () => {
      const { error: storageError } = await supabase.storage
        .from("property-photos")
        .remove([image.storage_path]);

      if (storageError) {
        setError("No se pudo eliminar la imagen.");
        return;
      }

      const { error: deleteError } = await supabase
        .from("property_images")
        .delete()
        .eq("id", image.id);

      if (deleteError) {
        setError("La imagen se borró del almacenamiento pero no del registro. Recargá la página.");
        return;
      }

      setImages((prev) => prev.filter((i) => i.id !== image.id));
    });
  }

  async function handleSetCover(image: PropertyImage) {
    if (image.position === 0) return;
    const currentCover = images.find((i) => i.position === 0);

    startTransition(async () => {
      await supabase.from("property_images").update({ position: 0 }).eq("id", image.id);
      if (currentCover) {
        await supabase
          .from("property_images")
          .update({ position: image.position })
          .eq("id", currentCover.id);
      }

      setImages((prev) =>
        prev
          .map((i) => {
            if (i.id === image.id) return { ...i, position: 0 };
            if (currentCover && i.id === currentCover.id) return { ...i, position: image.position };
            return i;
          })
          .sort((a, b) => a.position - b.position)
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image) => (
          <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <Image
              src={publicUrl(image.storage_path)}
              alt=""
              fill
              className="object-cover"
              sizes="200px"
            />
            {image.position === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                Portada
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              {image.position !== 0 && (
                <button
                  type="button"
                  onClick={() => handleSetCover(image)}
                  className="rounded-lg bg-white/90 p-1.5 text-slate-700 hover:bg-white"
                  title="Hacer portada"
                >
                  <Star size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(image)}
                className="rounded-lg bg-white/90 p-1.5 text-red-600 hover:bg-white"
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
          className="border-black! bg-black! text-white! hover:bg-neutral-800!"
        >
          <Upload size={16} />
          {isPending ? "Procesando..." : "Agregar fotos"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
