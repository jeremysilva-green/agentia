"use client";

import { useState, useTransition } from "react";
import { Download, Eye, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CopyLinkButton } from "@/components/panel/CopyLinkButton";
import { MonthYearAccordion } from "@/components/panel/MonthYearAccordion";
import { deletePropertyFlyer, deleteAffiliateFlyer } from "@/lib/actions/propertyFlyer";
import { getPublicStorageUrl } from "@/lib/storage";
import type { PropertyFlyerRow } from "@/lib/data/propertyFlyers";

// Agents share via /sa/<code>; affiliates via their affiliate link, /s/<code>.
export type FlyerOwner = "agent" | "affiliate";

function FlyerCard({ flyer, siteUrl, owner }: { flyer: PropertyFlyerRow; siteUrl: string; owner: FlyerOwner }) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const url = getPublicStorageUrl("property-flyers", flyer.storage_path);
  const shortUrl = flyer.share_code ? `${siteUrl}/${owner === "affiliate" ? "s" : "sa"}/${flyer.share_code}` : null;

  // The file lives on another origin, where <a download> is ignored — fetch it
  // and download the blob instead.
  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await (await fetch(url)).blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `flyer-${flyer.property_id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } finally {
      setDownloading(false);
    }
  }

  function handleDelete() {
    setConfirmOpen(false);
    startTransition(async () => {
      await (owner === "affiliate" ? deleteAffiliateFlyer : deletePropertyFlyer)(flyer.property_id);
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] p-4">
      <div className="relative overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "1520 / 2062" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Flyer de ${flyer.property_title}`} loading="lazy" className="h-full w-full object-cover" />
      </div>

      <div className="flex items-center gap-2">
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/30"
          style={{ backgroundColor: flyer.accent_color }}
          title="Color principal"
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{flyer.property_title}</h3>
          <p className="truncate text-xs text-[var(--muted)]">{flyer.property_city}</p>
        </div>
      </div>

      {shortUrl && (
        <div className="flex items-center gap-2 rounded-lg bg-black/40 p-2">
          <span className="min-w-0 flex-1 truncate text-xs text-[#cfcfcf]" title={shortUrl}>
            {shortUrl.replace(/^https?:\/\//, "")}
          </span>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#13c47f44] bg-[#13c47f1a] px-2 py-0.5 text-[11px] font-semibold text-[var(--em-2)]"
            title="Clics en el enlace"
          >
            <Eye size={11} />
            {flyer.click_count}
          </span>
          <CopyLinkButton url={shortUrl} dark />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-medium text-[#d5d5d5] hover:border-[var(--em)] hover:text-[var(--em-2)] disabled:opacity-60"
        >
          <Download size={13} />
          {downloading ? "Descargando..." : "Descargar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#ff5a5a33] px-2.5 py-1.5 text-xs font-medium text-[#ff8a8a] hover:bg-[#ff5a5a] hover:text-white disabled:opacity-60"
        >
          <Trash2 size={13} />
          Eliminar
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar flyer"
        message="Se borra el flyer guardado de esta propiedad. Podés crear uno nuevo cuando quieras."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export function PropertyFlyersGrid({
  flyers,
  siteUrl,
  owner = "agent",
}: {
  flyers: PropertyFlyerRow[];
  siteUrl: string;
  owner?: FlyerOwner;
}) {
  return (
    <MonthYearAccordion
      rows={flyers}
      getDate={(flyer) => flyer.updated_at}
      dark
      renderGroup={(monthRows) => (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {monthRows.map((flyer) => (
            <FlyerCard key={flyer.id} flyer={flyer} siteUrl={siteUrl} owner={owner} />
          ))}
        </div>
      )}
    />
  );
}
