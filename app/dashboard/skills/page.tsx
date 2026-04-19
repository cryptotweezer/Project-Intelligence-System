import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SkillsClient from "./SkillsClient";

export default async function SkillsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: skills } = await (supabase.from("dash_skills") as any)
    .select("*")
    .eq("user_id", user.id)
    .order("created_at");

  const skillCount = (skills ?? []).length;
  const GUEST_LIMIT = 3;

  return (
    <div className="p-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="font-label text-outline mb-1" style={{ fontSize: "0.5rem", letterSpacing: "0.2em" }}>
          DASH
        </div>
        <h1 className="font-display text-2xl mb-2" style={{ letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Skills
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "580px" }}>
          Skills are custom instruction sets that extend Dash's capabilities. Invoke any skill by typing its command at the start of a message (e.g. <span style={{ color: "#22d3ee" }}>/pm</span> or <span style={{ color: "#22d3ee" }}>/dev</span>). Dash reads the skill from the database and applies it.
        </p>
        <div className="mt-4" style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, rgba(59,130,246,0.5), transparent)" }} />
      </div>

      {/* How it works */}
      <div
        className="p-5 mb-8"
        style={{ background: "rgba(34,211,238,0.03)", border: "1px solid rgba(34,211,238,0.15)", borderLeft: "3px solid rgba(34,211,238,0.4)" }}
      >
        <div className="font-label mb-3" style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "#22d3ee" }}>
          HOW TO USE
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "Create a skill",
              desc: "Give it a name, a /command, and write the instructions Dash should follow when it's invoked.",
            },
            {
              step: "2",
              title: "Invoke it in chat",
              desc: "Start your Dash message with the /command (e.g. \"/pm review my project\" or \"/dev check this architecture\"). Dash reads the skill and applies it.",
            },
            {
              step: "3",
              title: "Any AI can create skills too",
              desc: "Connect Claude Code or Cursor via Supabase MCP. They can create, read, and update skills directly in the database.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <span
                className="font-display flex-shrink-0"
                style={{ fontSize: "1.2rem", color: "rgba(34,211,238,0.3)", lineHeight: 1 }}
              >
                {item.step}
              </span>
              <div>
                <div className="font-label mb-1" style={{ fontSize: "0.55rem", letterSpacing: "0.1em", color: "var(--text-primary)" }}>
                  {item.title}
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills list + form */}
      <SkillsClient
        skills={skills ?? []}
        isOwner={user.isOwner}
        guestLimit={GUEST_LIMIT}
        skillCount={skillCount}
      />
    </div>
  );
}
