import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type AppUser = {
  id: string;
  email: string;
  isOwner: boolean;
  name?: string;
  avatarUrl?: string;
};

export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    isOwner: user.email === process.env.OWNER_EMAIL,
    name: user.user_metadata?.full_name || user.user_metadata?.name || undefined,
    avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
  };
});
