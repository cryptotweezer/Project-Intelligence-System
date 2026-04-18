"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export async function markTourSeen(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.isOwner) return;

  await supabaseAdmin
    .from("guest_limits" as never)
    .update({ has_seen_tour: true } as never)
    .eq("user_id" as never, user.id);
}
