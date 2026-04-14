import { createClient } from "@supabase/supabase-js";

export function createResumeClient() {
  return createClient(
    process.env.RESUME_SUPABASE_URL!,
    process.env.RESUME_SUPABASE_ANON_KEY!
  );
}
