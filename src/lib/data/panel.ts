import { createClient } from "@/lib/supabase/server";

export async function getAgentContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: agentProfile }, { data: subscription }, { data: profile }] = await Promise.all([
    supabase.from("agent_profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("avatar_url").eq("id", user.id).single(),
  ]);

  return { userId: user.id, agentProfile, subscription, avatarUrl: profile?.avatar_url ?? null };
}
