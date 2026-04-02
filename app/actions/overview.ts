"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function recalculateCompletion(projectId: string): Promise<void> {
  const supabase = await createClient();
  const { data: steps } = await supabase
    .from("project_steps")
    .select("status")
    .eq("project_id", projectId);
  const total = steps?.length ?? 0;
  const done = steps?.filter((s: { status: string }) => s.status === "done").length ?? 0;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("projects") as any).update({ completion_pct: pct }).eq("id", projectId);
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("project_logs").delete().eq("project_id", id);
  await supabase.from("project_steps").delete().eq("project_id", id);
  await supabase.from("projects").delete().eq("id", id);
  redirect("/dashboard/projects");
}

export async function deleteLink(id: string, projectId: string): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("project_links") as any).delete().eq("id", id);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteLog(id: string, projectId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("project_logs").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteStep(id: string, projectId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("project_steps").delete().eq("id", id);
  await recalculateCompletion(projectId);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function updateStepStatus(
  stepId: string,
  status: string,
  projectId: string
): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("project_steps") as any).update({ status }).eq("id", stepId);
  await recalculateCompletion(projectId);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function updateProjectField(
  projectId: string,
  field: "description" | "expected_result",
  value: string
): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("projects") as any).update({ [field]: value || null }).eq("id", projectId);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function moveStep(
  stepId: string,
  projectId: string,
  direction: "up" | "down"
): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: steps } = await (supabase.from("project_steps") as any)
    .select("id, step_number")
    .eq("project_id", projectId)
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
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function createStep(
  projectId: string,
  title: string,
  description: string
): Promise<void> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("project_steps")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  const nextStep = (count ?? 0) + 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("project_steps") as any).insert({
    project_id: projectId,
    step_number: nextStep,
    title,
    description: description || null,
    status: "pending",
  });
  await recalculateCompletion(projectId);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
}

