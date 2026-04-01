import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectStep } from "@/lib/types";

type ProjectWithRelations = Project & {
  project_steps: ProjectStep[];
};

const tinyBadge: React.CSSProperties = { fontSize: "0.45rem", padding: "0.1rem 0.35rem", letterSpacing: "0.08em" };

function PriorityBadge({ priority }: { priority: string }) {
  const cls =
    priority === "Urgent"
      ? "badge badge-urgent"
      : priority === "Normal"
      ? "badge badge-normal"
      : "badge badge-someday";
  return <span className={cls} style={tinyBadge}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`} style={tinyBadge}>{status}</span>;
}

export default async function DashboardOverview() {
  const supabase = await createClient();

  const [{ data: projects }, { count: completedCount }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, project_steps(*)")
      .in("status", ["active", "paused"])
      .order("created_at", { ascending: true }),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .in("status", ["done", "archived"]),
  ]);

  const priorityOrder: Record<string, number> = { Urgent: 0, Normal: 1, Someday: 2 };
  const allProjects = ((projects ?? []) as ProjectWithRelations[]).sort(
    (a, b) =>
      (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3) ||
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const activeCount = allProjects.filter((p) => p.status === "active").length;

  return (
    <div className="p-10 animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-3xl text-white" style={{ letterSpacing: "-0.02em" }}>
          Project Intelligence System
        </h1>
        <div className="mt-3" style={{ width: "60px", height: "1px", background: "linear-gradient(90deg, rgba(59,130,246,0.5), transparent)" }} />
      </div>

      {/* Global Stats */}
      <div className="flex gap-4 mb-10">
        <a
          href="/dashboard/projects"
          className="px-6 py-4 transition-opacity duration-150 hover:opacity-80"
          style={{ background: "rgba(14,14,14,0.8)", border: "1px solid rgba(65,71,84,0.2)" }}
        >
          <div className="font-label text-outline mb-1" style={{ fontSize: "0.55rem", letterSpacing: "0.2em" }}>
            ACTIVE
          </div>
          <div className="font-display text-electric-blue text-2xl" style={{ letterSpacing: "-0.02em" }}>
            {activeCount}
          </div>
        </a>

        <a
          href="/dashboard/completed"
          className="px-6 py-4 transition-opacity duration-150 hover:opacity-80"
          style={{ background: "rgba(14,14,14,0.8)", border: "1px solid rgba(65,71,84,0.2)" }}
        >
          <div className="font-label text-outline mb-1" style={{ fontSize: "0.55rem", letterSpacing: "0.2em" }}>
            COMPLETED
          </div>
          <div className="font-display text-electric-blue text-2xl" style={{ letterSpacing: "-0.02em" }}>
            {completedCount ?? 0}
          </div>
        </a>
      </div>

      {/* Compact Project Cards */}
      {allProjects.length === 0 ? (
        <div className="p-12 text-center" style={{ border: "1px solid rgba(65,71,84,0.2)" }}>
          <div className="font-label text-outline" style={{ fontSize: "0.65rem", letterSpacing: "0.2em" }}>
            NO PROJECTS FOUND
          </div>
          <p className="text-outline font-light text-sm mt-2">Initialize your first project to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-2">
          {allProjects.map((project) => {
            const steps = project.project_steps ?? [];
            const stepsDone = steps.filter((s) => s.status === "done").length;
            const stepsPending = steps.filter((s) => s.status !== "done").length;
            const pct = project.completion_pct ?? 0;
            const descSnippet = project.description
              ? project.description.split("\n")[0].slice(0, 80) + (project.description.split("\n")[0].length > 80 ? "…" : "")
              : null;

            return (
              <a
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="block px-4 py-3 transition-all duration-150 group"
                style={{
                  background: "rgba(14,14,14,0.8)",
                  border: "1px solid rgba(65,71,84,0.2)",
                  borderLeft: project.priority === "Urgent"
                    ? "2px solid rgba(255,178,190,0.5)"
                    : project.priority === "Normal"
                    ? "2px solid rgba(59,130,246,0.3)"
                    : "2px solid rgba(65,71,84,0.2)",
                }}
              >
                {/* Category + badges inline */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-label text-outline" style={{ fontSize: "0.48rem", letterSpacing: "0.15em" }}>
                    {project.category}
                  </span>
                  <PriorityBadge priority={project.priority} />
                  <StatusBadge status={project.status} />
                </div>

                {/* Name */}
                <h2
                  className="font-display text-white group-hover:text-electric-blue transition-colors duration-150 mb-1"
                  style={{ fontSize: "0.92rem", letterSpacing: "-0.01em" }}
                >
                  {project.name}
                </h2>

                {/* Agent */}
                <div className="font-label mb-2" style={{ fontSize: "0.45rem", letterSpacing: "0.12em", color: "rgba(209,188,255,0.45)" }}>
                  ASSIGNED · {project.agent.toUpperCase()}
                </div>

                {/* Description snippet */}
                {descSnippet && (
                  <p className="text-outline font-light mb-2" style={{ fontSize: "0.68rem", lineHeight: "1.4" }}>
                    {descSnippet}
                  </p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-3 flex-wrap" style={{ borderTop: "1px solid rgba(65,71,84,0.12)", paddingTop: "6px" }}>
                  <span className="font-label" style={{ fontSize: "0.48rem", letterSpacing: "0.1em", color: "rgba(59,130,246,0.7)" }}>
                    PROGRESS {pct}%
                  </span>
                  <span className="font-label" style={{ fontSize: "0.48rem", letterSpacing: "0.1em", color: "#3b82f6" }}>
                    DONE {stepsDone}
                  </span>
                  <span className="font-label" style={{ fontSize: "0.48rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.9)" }}>
                    PENDING {stepsPending}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
