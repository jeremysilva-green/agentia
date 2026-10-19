import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "@/components/panel/PanelNav";
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
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 font-sans sm:px-6 lg:flex-row lg:items-start">
        <aside className="lg:w-[264px] lg:shrink-0">
          <PanelNav variant="agent" notifications={notifications} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
