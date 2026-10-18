import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMlsNotices, type MlsNoticeFilter } from "@/lib/data/mlsNotices";
import { AvisosList } from "@/components/panel/avisos/AvisosList";
import { AvisosFilterPills } from "@/components/panel/avisos/AvisosFilterPills";
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
      <h1 className="font-display text-2xl font-semibold text-white">{copy.panel.avisos}</h1>
      <AvisosFilterPills current={filter} />
      <AvisosList notices={notices} />
    </div>
  );
}
