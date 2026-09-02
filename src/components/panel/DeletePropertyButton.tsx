"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { deleteProperty } from "@/lib/actions/properties";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setConfirmOpen(false);
    startTransition(async () => {
      await deleteProperty(propertyId);
      router.push("/panel/propiedades");
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
      >
        <Trash2 size={15} />
        {isPending ? "Eliminando..." : "Eliminar propiedad"}
      </Button>

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar propiedad"
        message="¿Eliminar esta propiedad y todas sus fotos? Esta acción no se puede deshacer."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
