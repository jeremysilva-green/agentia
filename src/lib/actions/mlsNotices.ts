"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Per-notice read state, independent of the nav dot's whole-section
// seen_at (markSectionSeen("avisos")) — a notice keeps its own unread
// visual treatment in the list until this is called on it specifically.
// RLS (recipient_user_id = auth.uid()) plus the append-only trigger on
// mls_notices mean this can only ever touch read_at, even though the
// client sends a plain .update() call.
export async function markMlsAvisoRead(noticeId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("mls_notices")
    .update({ read_at: new Date().toISOString() })
    .eq("id", noticeId)
    .eq("recipient_user_id", user.id);

  revalidatePath("/panel/avisos");
}

// Clears one notice out of the agent's own inbox. RLS (recipient_user_id =
// auth.uid()) backs the .eq() filter below — the append-only trigger on
// this table only guards UPDATE, never DELETE, so this is a real row
// removal, not a soft-dismiss.
export async function deleteMlsNotice(noticeId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("mls_notices").delete().eq("id", noticeId).eq("recipient_user_id", user.id);

  revalidatePath("/panel/avisos");
}

export async function deleteAllMlsNotices(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("mls_notices").delete().eq("recipient_user_id", user.id);

  revalidatePath("/panel/avisos");
}
