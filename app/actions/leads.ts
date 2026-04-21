"use server";

import { createResumeClient } from "@/lib/supabase/resume";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteLead(id: number) {
  const user = await getCurrentUser();
  if (!user?.isOwner) throw new Error("Unauthorized");

  const supabase = createResumeClient();
  const { error } = await supabase.from("contact_leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/leads");
}

export async function deleteResumeUser(id: number) {
  const user = await getCurrentUser();
  if (!user?.isOwner) throw new Error("Unauthorized");

  const supabase = createResumeClient();
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/leads");
}
