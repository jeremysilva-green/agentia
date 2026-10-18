import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type MlsMembership = Database["public"]["Tables"]["mls_memberships"]["Row"];
export type MlsRuleVersion = Database["public"]["Tables"]["mls_rule_versions"]["Row"];

export type MlsMembershipStatus = {
  membership: MlsMembership | null;
  currentRuleVersion: MlsRuleVersion | null;
  // True once the agent's accepted_rule_version_id no longer matches the
  // current published version — e.g. a new Reglamento went out while they
  // were an active member.
  needsReaccept: boolean;
};

// Plain Server Component data fetch (not a server action) — drives the
// /panel/mls page's three states: join form, already-a-member, or
// needs-re-accept.
export async function getMlsMembershipStatus(userId: string): Promise<MlsMembershipStatus> {
  const supabase = await createClient();

  const [{ data: membership }, { data: currentRuleVersion }] = await Promise.all([
    supabase.from("mls_memberships").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("mls_rule_versions").select("*").order("version", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const needsReaccept = Boolean(
    membership &&
      membership.status === "active" &&
      currentRuleVersion &&
      membership.accepted_rule_version_id !== currentRuleVersion.id
  );

  return { membership: membership ?? null, currentRuleVersion: currentRuleVersion ?? null, needsReaccept };
}
