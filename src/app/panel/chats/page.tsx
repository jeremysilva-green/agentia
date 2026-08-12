import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentChats } from "@/lib/data/chats";
import { ChatsTable } from "@/components/panel/ChatsTable";
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
      <h1 className="font-display text-2xl font-semibold text-slate-900">{copy.panel.chats}</h1>
      <ChatsTable rows={rows} />
    </div>
  );
}
