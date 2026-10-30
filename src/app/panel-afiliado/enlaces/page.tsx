import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PropertyFlyersGrid } from "@/components/panel/PropertyFlyersGrid";
import { listAffiliateFlyersForUser } from "@/lib/data/affiliateFlyers";
import { getSiteUrl } from "@/lib/siteUrl";
import { EmptyState } from "@/components/panel/theme/EmptyState";
import { copy } from "@/lib/copy";

export default async function AffiliateLinksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const flyers = await listAffiliateFlyersForUser(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
          <span className="panel-pulse-dot" />
          Marketing
        </div>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">{copy.affiliatePanel.myLinks}</h1>
        <p className="mt-2 text-[15px] text-[var(--muted)]">
          Flyers con tu foto y tu enlace de afiliado, listos para descargar y compartir. Creá uno con &quot;Generar
          link&quot; en cualquier propiedad.
        </p>
      </div>

      {flyers.length === 0 ? (
        <EmptyState message="Todavía no guardaste ningún flyer. Tocá “Generar link” en una propiedad para crear el primero." />
      ) : (
        <PropertyFlyersGrid flyers={flyers} siteUrl={getSiteUrl()} owner="affiliate" />
      )}
    </div>
  );
}
