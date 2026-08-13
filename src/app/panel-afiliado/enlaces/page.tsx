import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAffiliateLinksForUser } from "@/lib/data/affiliateLinks";
import { AffiliateLinksTable } from "@/components/panel/AffiliateLinksTable";
import { copy } from "@/lib/copy";

export default async function AffiliateLinksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const [rows, { data: profile }] = await Promise.all([
    getAffiliateLinksForUser(user.id),
    supabase.from("profiles").select("username").eq("id", user.id).single(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-white">{copy.affiliatePanel.myLinks}</h1>
        <p className="text-sm text-slate-300">{copy.affiliatePanel.myLinksSubtitle}</p>
      </div>
      <AffiliateLinksTable rows={rows} affiliateUsername={profile?.username ?? ""} />
    </div>
  );
}
