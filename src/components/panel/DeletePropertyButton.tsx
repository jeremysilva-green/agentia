"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteProperty } from "@/lib/actions/properties";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("¿Eliminar esta propiedad y todas sus fotos? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      await deleteProperty(propertyId);
      router.push("/panel/propiedades");
    });
  }

  return (
    <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={isPending}>
      <Trash2 size={15} />
      {isPending ? "Eliminando..." : "Eliminar propiedad"}
    </Button>
  );
}
