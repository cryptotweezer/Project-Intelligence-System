"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

const GUEST_SKILL_LIMIT = 3;

export async function createSkill(
  name: string,
  command: string,
  content: string,
  description?: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const cmd = command.startsWith("/") ? command : `/${command}`;
  const supabase = await createClient();

  if (!user.isOwner) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase.from("dash_skills") as any)
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= GUEST_SKILL_LIMIT) {
      return { error: `Guest accounts are limited to ${GUEST_SKILL_LIMIT} skills (1 base + 2 custom). Upgrade to owner access to create unlimited skills.` };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("dash_skills") as any).insert({
    user_id: user.id,
    name,
    command: cmd.toLowerCase(),
    content,
    description: description ?? null,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/skills");
  return {};
}

export async function updateSkill(
  id: string,
  fields: { name?: string; command?: string; content?: string; description?: string; is_active?: boolean }
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const updates: Record<string, unknown> = { ...fields };
  if (fields.command) {
    updates.command = fields.command.startsWith("/") ? fields.command.toLowerCase() : `/${fields.command.toLowerCase()}`;
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("dash_skills") as any)
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/skills", "layout");
  return {};
}

export async function deleteSkill(id: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("dash_skills") as any)
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/skills");
  return {};
}
