"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

async function recalculateCompletion(projectId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { data: steps } = await supabase
    .from("project_steps")
    .select("status")
    .eq("project_id", projectId)
    .eq("user_id", userId);
  const total = steps?.length ?? 0;
  const done = steps?.filter((s: { status: string }) => s.status === "done").length ?? 0;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("projects") as any).update({ completion_pct: pct }).eq("id", projectId).eq("user_id", userId);
}

export async function deleteProject(id: string, redirectTo = "/dashboard/projects"): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase.from("project_logs").delete().eq("project_id", id).eq("user_id", user.id);
  await supabase.from("project_steps").delete().eq("project_id", id).eq("user_id", user.id);
  await supabase.from("projects").delete().eq("id", id).eq("user_id", user.id);
  redirect(redirectTo);
}

export async function deleteLink(id: string, projectId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("project_links") as any).delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/projects", "layout");
}

export async function deleteLog(id: string, projectId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase.from("project_logs").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects", "layout");
}

export async function deleteStep(id: string, projectId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase.from("project_steps").delete().eq("id", id).eq("user_id", user.id);
  await recalculateCompletion(projectId, user.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects", "layout");
}

export async function updateStepStatus(
  stepId: string,
  status: string,
  projectId: string
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("project_steps") as any).update({ status }).eq("id", stepId).eq("user_id", user.id);
  await recalculateCompletion(projectId, user.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects", "layout");
}

export async function updateProjectStatus(projectId: string, status: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("projects") as any).update({ status }).eq("id", projectId).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/projects", "layout");
}

export async function updateProjectAgent(projectId: string, agent: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("projects") as any).update({ agent }).eq("id", projectId).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/projects", "layout");
}

export async function updateProjectPriority(projectId: string, priority: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("projects") as any).update({ priority }).eq("id", projectId).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects", "layout");
}

export async function updateProjectField(
  projectId: string,
  field: "description" | "expected_result",
  value: string
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("projects") as any).update({ [field]: value || null }).eq("id", projectId).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects", "layout");
}

export async function moveStep(
  stepId: string,
  projectId: string,
  direction: "up" | "down"
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: steps } = await (supabase.from("project_steps") as any)
    .select("id, step_number")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .order("step_number") as { data: { id: string; step_number: number }[] | null };

  if (!steps) return;
  const idx = steps.findIndex((s) => s.id === stepId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= steps.length) return;

  const a = steps[idx];
  const b = steps[swapIdx];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("project_steps") as any).update({ step_number: b.step_number }).eq("id", a.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("project_steps") as any).update({ step_number: a.step_number }).eq("id", b.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects", "layout");
}

export async function markProjectDone(projectId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  const { data: steps } = await supabase
    .from("project_steps")
    .select("status")
    .eq("project_id", projectId)
    .eq("user_id", user.id);

  if (!steps || steps.length === 0) return;
  const allDone = steps.every((s: { status: string }) => s.status === "done");
  if (!allDone) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("projects") as any)
    .update({ status: "done", completion_pct: 100 })
    .eq("id", projectId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/completed");
  revalidatePath("/dashboard/projects", "layout");
  redirect("/dashboard/completed");
}

export async function reorderSteps(projectId: string, orderedStepIds: string[]): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await Promise.all(
    orderedStepIds.map((id, index) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("project_steps") as any)
        .update({ step_number: index + 1 })
        .eq("id", id)
        .eq("user_id", user.id)
    )
  );
  revalidatePath("/dashboard/projects", "layout");
}

export async function updateStepNotes(stepId: string, notes: string, projectId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("project_steps") as any)
    .update({ notes })
    .eq("id", stepId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/projects", "layout");
}

export async function reactivateProject(projectId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("projects") as any)
    .update({ status: "active" })
    .eq("id", projectId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/completed");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
}

export async function createStep(
  projectId: string,
  title: string,
  description: string
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  const { count } = await supabase
    .from("project_steps")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("user_id", user.id);

  const nextStep = (count ?? 0) + 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("project_steps") as any).insert({
    project_id: projectId,
    user_id: user.id,
    step_number: nextStep,
    title,
    description: description || null,
    status: "pending",
  });
  await recalculateCompletion(projectId, user.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects", "layout");
}
