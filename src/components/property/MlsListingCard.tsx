import Image from "next/image";
import { MapPin, MessageCircle, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PanelBadge } from "@/components/panel/theme/PanelBadge";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants/propertyTypes";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatShortName } from "@/lib/text";
import type { MlsListingWithProperty } from "@/lib/data/mlsListings";

// Deliberately a separate component from PropertyCard, not a third mode of
// it — PropertyCard is hard-wired to the public single-agent-portfolio
// route/button shape and has no concept of a private minimum price or
// co-broke offer (confirmed by exploration before building this). No
// click-through to a dedicated detail page this slice — the card itself
// carries what a member needs to decide whether to reach out.
export async function MlsListingCard({ listing }: { listing: MlsListingWithProperty }) {
  const supabase = await createClient();
  const cover = [...listing.property.property_images].sort((a, b) => a.position - b.position)[0];
  const coverUrl = cover
    ? supabase.storage.from("property-photos").getPublicUrl(cover.storage_path).data.publicUrl
    : null;

  const typeLabel = listing.property.property_type
    ? PROPERTY_TYPE_LABELS[listing.property.property_type as PropertyType]?.es
    : null;

  const whatsappMessage = `Hola ${formatShortName(listing.agent.full_name ?? listing.agent.username)}, vi "${listing.property.title}" en el MLS de Agentia. Tengo un comprador interesado.`;

  return (
    <div className="flex h-full flex-col gap-0 overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--ink-2)] transition-transform duration-300 hover:-translate-y-1 hover:border-[#0a8f5c88]">
      <div className="relative aspect-[1.27/1] overflow-hidden bg-black/40">
        {coverUrl ? (
          <Image src={coverUrl} alt={listing.property.title} fill className="object-cover" sizes="360px" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">Sin foto</div>
        )}
        <PanelBadge tone="blue" className="absolute top-3 left-3 bg-black/60! backdrop-blur-sm">
          {listing.authorization_type === "exclusiva" ? "Exclusiva" : "No exclusiva"}
        </PanelBadge>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="truncate font-display text-base font-semibold text-white">{listing.property.title}</h3>
        <p className="flex items-center gap-1 text-xs text-[var(--muted)]">
          <MapPin size={12} className="text-[var(--em-2)]" />
          {listing.property.address ? `${listing.property.address}, ` : ""}
          {listing.property.city}
          {typeLabel ? ` · ${typeLabel}` : ""}
        </p>

        <div className="mt-1 flex items-center justify-between rounded-xl border border-[#13c47f33] bg-[#13c47f17] px-3 py-2">
          <span className="text-xs font-semibold text-[var(--em-2)]">Cooperación</span>
          <span className="font-display text-base font-semibold text-white">{listing.cobroke_percent}%</span>
        </div>

        {listing.private?.owner_min_price != null && (
          <p className="text-sm font-medium text-white">
            Mínimo:{" "}
            {new Intl.NumberFormat("es-PY", { style: "currency", currency: listing.property.currency, maximumFractionDigits: 0 }).format(
              listing.private.owner_min_price
            )}
          </p>
        )}

        {listing.private?.showing_instructions && (
          <p className="flex items-start gap-1.5 text-xs text-[var(--muted)]">
            <Lock size={12} className="mt-0.5 shrink-0" />
            {listing.private.showing_instructions}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
          <span className="truncate text-xs text-[var(--muted)]">{formatShortName(listing.agent.full_name ?? listing.agent.username)}</span>
          {listing.agent.phone && (
            <a
              href={buildWhatsAppUrl(listing.agent.phone, whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#1fb855]"
            >
              <MessageCircle size={12} />
              Contactar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
