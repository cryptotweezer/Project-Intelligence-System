import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectStep, ProjectLog } from "@/lib/types";
import ProjectsList from "./ProjectsList";

type ProjectWithRelations = Project & {
  project_steps: ProjectStep[];
  project_logs: ProjectLog[];
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*, project_steps(*), project_logs(*)")
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: true });

  const priorityOrder: Record<string, number> = { Urgent: 0, Normal: 1, Someday: 2 };
  const sorted = ((projects ?? []) as ProjectWithRelations[]).sort(
    (a, b) =>
      (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3) ||
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="p-10 animate-fade-in">
      <div className="mb-10">
        <div className="font-label text-outline mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.25em" }}>
          ACTIVE
        </div>
        <h1 className="font-display text-3xl text-white" style={{ letterSpacing: "-0.02em" }}>
          Projects
        </h1>
        <div className="mt-3" style={{ width: "60px", height: "1px", background: "linear-gradient(90deg, rgba(59,130,246,0.5), transparent)" }} />
      </div>

      {error && (
        <div className="font-label text-ruby-red mb-6" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>
          ERROR: {error.message}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="p-12 text-center" style={{ border: "1px solid rgba(65,71,84,0.2)" }}>
          <div className="font-label text-outline" style={{ fontSize: "0.65rem", letterSpacing: "0.2em" }}>
            NO PROJECTS FOUND
          </div>
          <p className="text-outline font-light text-sm mt-2">Initialize your first project to begin.</p>
        </div>
      ) : (
        <ProjectsList projects={sorted} />
      )}
    </div>
  );
}
