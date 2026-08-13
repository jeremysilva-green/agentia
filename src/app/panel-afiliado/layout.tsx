import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { PanelNav } from "@/components/panel/PanelNav";

export default async function AffiliatePanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar?next=/panel-afiliado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "user") redirect("/");

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />
      <div className="font-display-light relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <PanelNav variant="affiliate" />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
