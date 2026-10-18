import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type MlsNotice = Database["public"]["Tables"]["mls_notices"]["Row"];

// Only "listings" has a real signal this slice (listing_id set) — buyers/
// showings/closings are built generically now so later slices (which add
// registration_id/showing_id/closing_id-bearing notices) don't need to
// touch this filter logic again.
export type MlsNoticeFilter = "all" | "listings" | "buyers" | "showings" | "closings" | "no_leidos";

export async function listMlsNotices(userId: string, filter: MlsNoticeFilter = "all"): Promise<MlsNotice[]> {
  const supabase = await createClient();
  let query = supabase
    .from("mls_notices")
    .select("*")
    .eq("recipient_user_id", userId)
    .order("event_at", { ascending: false });

  if (filter === "listings") query = query.not("listing_id", "is", null);
  else if (filter === "buyers") query = query.not("registration_id", "is", null);
  else if (filter === "showings") query = query.not("showing_id", "is", null);
  else if (filter === "closings") query = query.not("closing_id", "is", null);
  else if (filter === "no_leidos") query = query.is("read_at", null);

  const { data } = await query;
  return data ?? [];
}

export async function countUnreadMlsNotices(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("mls_notices")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}
