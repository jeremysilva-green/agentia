"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UpgradeModal } from "@/components/panel/UpgradeModal";
import { SpotlightCard } from "@/components/panel/theme/SpotlightCard";

export function NuevaPropiedadButton({
  atLimit,
  variant = "button",
  fundadorSeatsRemaining,
}: {
  atLimit: boolean;
  variant?: "button" | "tile";
  fundadorSeatsRemaining?: number;
}) {
  const [showModal, setShowModal] = useState(false);

  const trigger =
    variant === "tile" ? (
      <SpotlightCard
        onClick={() => atLimit && setShowModal(true)}
        className="group flex h-full min-h-[260px] w-full cursor-pointer flex-col items-center justify-center gap-3.5 rounded-[24px] border-[1.5px] border-dashed border-[#2f2f2f] p-8 text-center text-[var(--muted)] transition-colors hover:border-[var(--em)] hover:text-white"
      >
        <span className="relative z-10 flex h-[60px] w-[60px] items-center justify-center rounded-[20px] border border-[#13c47f44] bg-[#13c47f17] text-[var(--em-2)] transition-transform duration-500 group-hover:rotate-90 group-hover:scale-105">
          <Plus size={26} />
        </span>
        <b className="relative z-10 font-display text-xl font-semibold text-white">Nueva propiedad</b>
        <span className="relative z-10 max-w-[220px] text-[13.5px]">
          Cargá fotos, precio y ubicación. Se publica lista para compartir.
        </span>
      </SpotlightCard>
    ) : (
      <Button size="sm" className="bg-emerald-600! hover:bg-emerald-700!" onClick={() => atLimit && setShowModal(true)}>
        <Plus size={16} />
        Nueva propiedad
      </Button>
    );

  if (!atLimit) {
    return <Link href="/panel/propiedades/nueva">{trigger}</Link>;
  }

  return (
    <>
      {trigger}

      <UpgradeModal
        reason="properties"
        open={showModal}
        onClose={() => setShowModal(false)}
        fundadorSeatsRemaining={fundadorSeatsRemaining}
      />
    </>
  );
}
