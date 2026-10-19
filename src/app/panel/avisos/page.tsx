import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMlsNotices, type MlsNoticeFilter } from "@/lib/data/mlsNotices";
import { AvisosList } from "@/components/panel/avisos/AvisosList";
import { AvisosFilterPills } from "@/components/panel/avisos/AvisosFilterPills";
import { Reveal } from "@/components/panel/theme/Reveal";
import { copy } from "@/lib/copy";

const VALID_FILTERS: MlsNoticeFilter[] = ["all", "listings", "buyers", "showings", "closings", "no_leidos"];

export default async function AvisosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { filter: rawFilter } = await searchParams;
  const filter: MlsNoticeFilter = VALID_FILTERS.includes(rawFilter as MlsNoticeFilter)
    ? (rawFilter as MlsNoticeFilter)
    : "all";

  const notices = await listMlsNotices(user.id, filter);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
          <span className="panel-pulse-dot" />
          Notificaciones
        </div>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">{copy.panel.avisos}</h1>
      </div>
      <Reveal>
        <AvisosFilterPills current={filter} />
      </Reveal>
      <Reveal delay={1}>
        <AvisosList notices={notices} />
      </Reveal>
    </div>
  );
}
