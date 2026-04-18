import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import LinksClient from "./LinksClient";

export default async function LinksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: links, error } = await (supabase
    .from("links" as never)
    .select("*")
    .eq("user_id" as never, user.id)
    .order("created_at", { ascending: false })) as unknown as {
      data: Array<{
        id: string;
        url: string;
        title: string | null;
        description: string | null;
        image_url: string | null;
        site_name: string | null;
        source_type: string;
        tags: string[];
        notes: string | null;
        is_read: boolean;
        created_at: string;
      }>;
      error: { message: string } | null;
    };

  const totalLinks = links?.length ?? 0;
  const unread = links?.filter((l) => !l.is_read).length ?? 0;
  const youtube = links?.filter((l) => l.source_type === "youtube").length ?? 0;

  return (
    <div className="p-4 sm:p-6 md:p-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div
          className="font-label text-outline mb-2"
          style={{ fontSize: "0.6rem", letterSpacing: "0.25em" }}
        >
          PERSONAL LIBRARY
        </div>
        <h1
          className="font-display text-3xl"
          style={{ letterSpacing: "-0.02em", color: "var(--text-primary)" }}
        >
          Links
        </h1>
        <div
          className="mt-3"
          style={{
            width: "60px",
            height: "1px",
            background: "linear-gradient(90deg, rgba(34,211,238,0.5), transparent)",
          }}
        />
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-6 mb-8">
        <div>
          <div
            className="font-label text-outline mb-1"
            style={{ fontSize: "0.55rem", letterSpacing: "0.15em" }}
          >
            TOTAL
          </div>
          <div
            className="font-display"
            style={{ fontSize: "1.8rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
          >
            {totalLinks}
          </div>
        </div>
        <div className="hidden sm:block" style={{ width: "1px", background: "var(--border-subtle)" }} />
        <div>
          <div
            className="font-label mb-1"
            style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#22d3ee" }}
          >
            UNREAD
          </div>
          <div
            className="font-display"
            style={{ fontSize: "1.8rem", letterSpacing: "-0.02em", color: "#22d3ee" }}
          >
            {unread}
          </div>
        </div>
        {youtube > 0 && (
          <>
            <div className="hidden sm:block" style={{ width: "1px", background: "var(--border-subtle)" }} />
            <div>
              <div
                className="font-label mb-1"
                style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#ef4444" }}
              >
                YOUTUBE
              </div>
              <div
                className="font-display"
                style={{ fontSize: "1.8rem", letterSpacing: "-0.02em", color: "#ef4444" }}
              >
                {youtube}
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <div
          className="font-label text-ruby-red mb-6"
          style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}
        >
          ERROR: {error.message}
        </div>
      )}

      <LinksClient links={links ?? []} />
    </div>
  );
}
