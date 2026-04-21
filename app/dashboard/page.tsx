import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Project, ProjectStep } from "@/lib/types";
import OverviewProjectList from "./OverviewProjectList";
import OnboardingTour from "@/components/OnboardingTour";

type ProjectWithSteps = Project & { project_steps: ProjectStep[] };

export default async function DashboardOverview() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: projects }, { count: completedCount }, { count: pausedCount }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, project_steps(*)")
      .eq("user_id", user.id)
      .in("status", ["active", "paused"])
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["done", "archived"]),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "paused"),
  ]);

  // Check if guest needs to see the onboarding tour
  let showTour = false;
  if (!user.isOwner) {
    // Ensure the row exists so markTourSeen() can update it immediately after tour completes
    await supabaseAdmin
      .from("guest_limits" as never)
      .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true } as never);

    const { data: limits } = await supabaseAdmin
      .from("guest_limits" as never)
      .select("has_seen_tour")
      .eq("user_id" as never, user.id)
      .single() as { data: { has_seen_tour: boolean } | null };
    showTour = limits?.has_seen_tour === false;
  }

  const allProjects = (projects ?? []) as ProjectWithSteps[];
  const activeCount = allProjects.filter((p) => p.status === "active").length;

  return (
    <div className="p-4 sm:p-6 md:p-10 animate-fade-in">
      {showTour && <OnboardingTour show />}

      {/* Header */}
      <div className="mb-10">
        <h1
          className="font-display text-3xl"
          style={{ letterSpacing: "-0.02em", color: "var(--text-primary)" }}
        >
          Project Intelligence System
        </h1>
        <div
          className="mt-3"
          style={{
            width: "60px",
            height: "1px",
            background: "linear-gradient(90deg, rgba(59,130,246,0.5), transparent)",
          }}
        />
      </div>

      {/* Project list — stats + filter + sortable + drag-and-drop */}
      <OverviewProjectList
        projects={allProjects}
        activeCount={activeCount}
        completedCount={completedCount ?? 0}
        pausedCount={pausedCount ?? 0}
      />
    </div>
  );
}
