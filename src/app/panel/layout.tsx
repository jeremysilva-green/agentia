import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "@/components/panel/PanelNav";
import { PanelShell } from "@/components/panel/PanelShell";
import { getPanelNotifications } from "@/lib/data/panelNotifications";
import "./panel-theme.css";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar?next=/panel");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "agent") redirect("/");

  const notifications = await getPanelNotifications(user.id);

  return (
    <div className="panel-dark relative min-h-full">
      <PanelShell nav={<PanelNav variant="agent" notifications={notifications} />}>{children}</PanelShell>
    </div>
  );
}
