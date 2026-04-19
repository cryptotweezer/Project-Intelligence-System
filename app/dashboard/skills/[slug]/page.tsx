import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import SkillDetail from "./SkillEditForm";

export default async function SkillDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const command = `/${params.slug}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: skill } = await (supabase.from("dash_skills") as any)
    .select("*")
    .eq("user_id", user.id)
    .eq("command", command)
    .single();

  if (!skill) notFound();

  return (
    <div className="p-6 md:p-10 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8" style={{ fontSize: "0.52rem" }}>
        <Link
          href="/dashboard/skills"
          className="font-label"
          style={{ letterSpacing: "0.15em", color: "var(--text-muted)", textDecoration: "none" }}
        >
          ← SKILLS
        </Link>
        <span style={{ color: "var(--text-dim)" }}>/</span>
        <span
          className="font-label"
          style={{ letterSpacing: "0.12em", color: "#22d3ee" }}
        >
          {skill.command}
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="font-label mb-1" style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "var(--text-dim)" }}>
          SKILL
        </div>
        <h1
          className="font-display"
          style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: "8px" }}
        >
          {skill.name}
        </h1>
        <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, rgba(59,130,246,0.5), transparent)" }} />
      </div>

      {/* Skill detail */}
      <SkillDetail skill={skill} isOwner={user.isOwner} />
    </div>
  );
}
