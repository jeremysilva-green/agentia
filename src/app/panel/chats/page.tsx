import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentChats } from "@/lib/data/chats";
import { ChatsTable } from "@/components/panel/ChatsTable";
import { Reveal } from "@/components/panel/theme/Reveal";
import { copy } from "@/lib/copy";

export default async function ChatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const rows = await getAgentChats(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
          <span className="panel-pulse-dot" />
          Conversaciones
        </div>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">{copy.panel.chats}</h1>
      </div>
      <Reveal>
        <ChatsTable rows={rows} />
      </Reveal>
    </div>
  );
}
