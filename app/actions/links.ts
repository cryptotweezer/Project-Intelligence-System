"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { fetchLinkMetadata } from "@/lib/links/metadata";

export async function saveLink(url: string, notes?: string, tags?: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();
  const meta = await fetchLinkMetadata(url);
  const mergedTags = Array.from(new Set([...(tags ?? []), ...meta.tags])).slice(0, 6);

  const { error } = await supabase.from("links" as never).insert({
    url,
    user_id:     user.id,
    title:       meta.title,
    description: meta.description,
    image_url:   meta.image_url,
    site_name:   meta.site_name,
    favicon_url: meta.favicon_url,
    source_type: meta.source_type,
    tags:        mergedTags,
    notes:       notes ?? null,
    is_read:     false,
  } as never);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/links");
}

export async function deleteLink(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase.from("links" as never).delete().eq("id", id).eq("user_id" as never, user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/links");
}

export async function toggleLinkRead(id: string, is_read: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase
    .from("links" as never)
    .update({ is_read } as never)
    .eq("id", id)
    .eq("user_id" as never, user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/links");
}
