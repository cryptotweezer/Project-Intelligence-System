import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectStep, ProjectLog } from "@/lib/types";
import CompletedList from "./CompletedList";

type ProjectWithRelations = Project & {
  project_steps: ProjectStep[];
  project_logs: ProjectLog[];
};

export default async function CompletedPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*, project_steps(*), project_logs(*)")
    .in("status", ["done", "archived"])
    .order("created_at", { ascending: false });

  const sorted = (projects ?? []) as ProjectWithRelations[];

  return (
    <div className="p-10 animate-fade-in">
      <div className="mb-10">
        <div className="font-label text-outline mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.25em" }}>
          TASK HISTORY
        </div>
        <h1 className="font-display text-3xl text-white" style={{ letterSpacing: "-0.02em" }}>
          Task Completed
        </h1>
        <div className="mt-3" style={{ width: "60px", height: "1px", background: "linear-gradient(90deg, rgba(59,130,246,0.3), transparent)" }} />
        {sorted.length > 0 && (
          <p className="font-label text-outline mt-3" style={{ fontSize: "0.5rem", letterSpacing: "0.15em" }}>
            {sorted.length} TASK{sorted.length !== 1 ? "S" : ""} COMPLETED
          </p>
        )}
      </div>

      {error && (
        <div className="font-label text-ruby-red mb-6" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>
          ERROR: {error.message}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="p-12 text-center" style={{ border: "1px solid rgba(65,71,84,0.2)" }}>
          <div className="font-label text-outline" style={{ fontSize: "0.65rem", letterSpacing: "0.2em" }}>
            NO COMPLETED TASKS
          </div>
          <p className="text-outline font-light text-sm mt-2">
            Tasks marked as done will appear here.
          </p>
        </div>
      ) : (
        <CompletedList projects={sorted} />
      )}
    </div>
  );
}
