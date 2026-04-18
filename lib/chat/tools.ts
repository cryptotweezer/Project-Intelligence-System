import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchLinkMetadata } from "@/lib/links/metadata";
import { generateSlug } from "@/lib/slug";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

// ── Tool Definitions ─────────────────────────────────────────────────────────

export const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_projects",
      description: "List projects (lightweight — id, name, status, priority, completion_pct only). Use filters to avoid loading everything.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["active", "paused", "done", "archived"] },
          priority: { type: "string", description: "Filter by priority. Standard values: Urgent, Scheduled, Someday. Custom values are also valid." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project",
      description: "Get full details of a project (steps + last 3 logs). Search by name (partial) or id.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new project. Call only after collecting all info and getting user confirmation.",
      parameters: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          priority: { type: "string", description: "Priority level. Standard: Urgent, Scheduled, Someday. Any custom string is also accepted (e.g. 'Next Week', 'Q2', etc.)." },
          status: { type: "string", enum: ["active", "paused"] },
          description: { type: "string" },
          expected_result: { type: "string" },
          github_repo: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_project",
      description: "Update one or more fields on an existing project.",
      parameters: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          category: { type: "string" },
          priority: { type: "string", description: "Priority level. Standard: Urgent, Scheduled, Someday. Any custom string is also accepted (e.g. 'Next Week', 'Q2', etc.)." },
          status: { type: "string", enum: ["active", "paused", "done", "archived"] },
          description: { type: "string" },
          expected_result: { type: "string" },
          github_repo: { type: "string" },
          completion_pct: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_project",
      description: "Permanently delete a project and all its steps and logs. Requires user confirmation.",
      parameters: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_step",
      description: "Add a new step to a project. Automatically recalculates project completion_pct.",
      parameters: {
        type: "object",
        required: ["project_id", "title"],
        properties: {
          project_id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_step",
      description: "Update a step's status, title, description, or notes. Identify the step using ONE of: step_id (UUID), project_id + step_number, or project_id + step_title (name search). Always provide project_id when searching by name or number.",
      parameters: {
        type: "object",
        properties: {
          step_id:     { type: "string", description: "UUID of the step (use if available)" },
          project_id:  { type: "string", description: "Required when using step_number or step_title lookup" },
          step_number: { type: "number", description: "1-based position number" },
          step_title:  { type: "string", description: "Step name/title — partial match, case-insensitive. Use when user refers to a step by name." },
          status:      { type: "string", enum: ["pending", "in_progress", "done", "error"] },
          title:       { type: "string" },
          description: { type: "string" },
          notes:       { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_step",
      description: "Delete a step. Identify the step using ONE of: step_id (UUID), project_id + step_number, or project_id + step_title (name search). Always provide project_id when searching by name or number.",
      parameters: {
        type: "object",
        properties: {
          step_id:     { type: "string", description: "UUID of the step (use if available)" },
          project_id:  { type: "string", description: "Required when using step_number or step_title lookup" },
          step_number: { type: "number", description: "1-based position number" },
          step_title:  { type: "string", description: "Step name/title — partial match, case-insensitive. Use when user refers to a step by name." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_step",
      description: "Move a step ONE position up or down. Use move_step_to for moving to a specific position number.",
      parameters: {
        type: "object",
        required: ["step_id", "project_id", "direction"],
        properties: {
          step_id: { type: "string" },
          project_id: { type: "string" },
          direction: { type: "string", enum: ["up", "down"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_step_to",
      description: "Move a step to a specific position number. Identify the step using step_id, project_id + step_number, or project_id + step_title. Do NOT use move_step repeatedly — one call handles the full reorder.",
      parameters: {
        type: "object",
        required: ["project_id", "target_position"],
        properties: {
          step_id:         { type: "string", description: "UUID of the step (use if available)" },
          project_id:      { type: "string" },
          step_number:     { type: "number", description: "Current position number of the step" },
          step_title:      { type: "string", description: "Step name — partial match, case-insensitive" },
          target_position: { type: "number", description: "The 1-based position to move the step to" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_log",
      description: "Add a work session log. Always use agent='Dash' unless explicitly told otherwise.",
      parameters: {
        type: "object",
        required: ["project_id", "summary"],
        properties: {
          project_id: { type: "string" },
          summary: { type: "string" },
          agent: { type: "string", description: "Default: Dash" },
          session_date: { type: "string", description: "ISO date, default: today" },
          problems: { type: "string" },
          solutions: { type: "string" },
          step_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_log",
      description: "Delete a session log entry.",
      parameters: {
        type: "object",
        required: ["log_id"],
        properties: {
          log_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_link",
      description: "Save a useful link to a project.",
      parameters: {
        type: "object",
        required: ["project_id", "title", "url"],
        properties: {
          project_id: { type: "string" },
          title: { type: "string", description: "Short descriptive title for the link" },
          url: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_links",
      description: "List all saved links for a project.",
      parameters: {
        type: "object",
        required: ["project_id"],
        properties: {
          project_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_link",
      description: "Delete a saved link.",
      parameters: {
        type: "object",
        required: ["link_id"],
        properties: {
          link_id: { type: "string" },
        },
      },
    },
  },

  // ── Personal saved links (links table — not tied to any project) ───────────
  {
    type: "function",
    function: {
      name: "save_link",
      description: "Save an interesting URL to the personal links library (not tied to any project). Automatically fetches title, description, thumbnail, and source type. Always suggest 2-4 relevant tags based on the content.",
      parameters: {
        type: "object",
        required: ["url"],
        properties: {
          url:   { type: "string", description: "The URL to save" },
          notes: { type: "string", description: "Optional personal note about why this was saved" },
          tags:  {
            type: "array",
            items: { type: "string" },
            description: "2-4 relevant tags suggested by you based on title/description (e.g. ['ai', 'tutorial', 'python'])",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_saved_links",
      description: "List saved personal links. Optionally filter by source_type or is_read.",
      parameters: {
        type: "object",
        properties: {
          source_type: { type: "string", enum: ["youtube", "twitter", "instagram", "facebook", "web", "other"] },
          is_read:     { type: "boolean", description: "true = already read, false = pending" },
          limit:       { type: "number",  description: "Max results, default 20" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_saved_link",
      description: "Delete a personal saved link by id.",
      parameters: {
        type: "object",
        required: ["link_id"],
        properties: {
          link_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_link_read",
      description: "Toggle the is_read status of a saved link.",
      parameters: {
        type: "object",
        required: ["link_id", "is_read"],
        properties: {
          link_id: { type: "string" },
          is_read: { type: "boolean" },
        },
      },
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function recalculateCompletion(projectId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: steps } = await (supabaseAdmin.from("project_steps") as any)
    .select("status")
    .eq("project_id", projectId) as { data: { status: string }[] | null };

  const total = steps?.length ?? 0;
  const done = steps?.filter((s) => s.status === "done").length ?? 0;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin.from("projects") as any)
    .update({ completion_pct: pct })
    .eq("id", projectId);
}

// ── Tool Executors ───────────────────────────────────────────────────────────

type Args = Record<string, unknown>;
type Context = { userId: string; isOwner: boolean };

/** Resolve a step UUID from step_id, project_id+step_number, or project_id+step_title */
async function resolveStepId(args: Args): Promise<{ id: string } | { error: string }> {
  if (args.step_id) return { id: args.step_id as string };

  if (!args.project_id) return { error: "Provide step_id or project_id + step_number/step_title." };

  if (args.step_number !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.from("project_steps") as any)
      .select("id")
      .eq("project_id", args.project_id)
      .eq("step_number", args.step_number)
      .single() as { data: { id: string } | null };
    if (!data) return { error: `No step found at position ${args.step_number} in this project.` };
    return { id: data.id };
  }

  if (args.step_title) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.from("project_steps") as any)
      .select("id, title")
      .eq("project_id", args.project_id)
      .ilike("title", `%${args.step_title}%`)
      .order("step_number")
      .limit(1)
      .single() as { data: { id: string; title: string } | null };
    if (!data) return { error: `No step matching "${args.step_title}" found in this project.` };
    return { id: data.id };
  }

  return { error: "Provide step_id, step_number, or step_title to identify the step." };
}

export async function executeTool(name: string, args: Args, context: Context): Promise<string> {
  try {
    switch (name) {

      case "list_projects": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabaseAdmin.from("projects") as any)
          .select("id, name, priority, status, completion_pct, agent")
          .eq("user_id", context.userId);
        if (args.status) query = query.eq("status", args.status);
        if (args.priority) query = query.eq("priority", args.priority);
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) return `Error: ${error.message}`;
        if (!data || data.length === 0) return "No projects found.";
        return JSON.stringify(data);
      }

      case "get_project": {
        if (!args.id && !args.name) return "Error: provide either id or name.";

        let projects: Record<string, unknown>[] | null = null;
        let pErr: { message: string } | null = null;

        if (args.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const res = await (supabaseAdmin.from("projects") as any).select("*").eq("id", args.id).eq("user_id", context.userId).limit(1);
          projects = res.data;
          pErr = res.error;
        } else {
          // Try exact match first, then partial — most recent wins
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const exact = await (supabaseAdmin.from("projects") as any).select("*")
            .ilike("name", args.name as string).eq("user_id", context.userId).limit(1);
          if (exact.data && exact.data.length > 0) {
            projects = exact.data;
            pErr = exact.error;
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const partial = await (supabaseAdmin.from("projects") as any).select("*")
              .ilike("name", `%${args.name}%`)
              .eq("user_id", context.userId)
              .order("created_at", { ascending: false })
              .limit(1);
            projects = partial.data;
            pErr = partial.error;
          }
        }
        if (pErr) return `Error: ${pErr.message}`;
        if (!projects || projects.length === 0) return "Project not found.";
        const project = projects[0];

        const [{ data: steps }, { data: logs }] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabaseAdmin.from("project_steps") as any)
            .select("*").eq("project_id", project.id).order("step_number"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabaseAdmin.from("project_logs") as any)
            .select("*").eq("project_id", project.id)
            .order("session_date", { ascending: false }).limit(3),
        ]);

        return JSON.stringify({ project, steps: steps ?? [], logs: logs ?? [] });
      }

      case "create_project": {
        // Generate a unique slug from the project name
        const baseSlug = generateSlug(args.name as string);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabaseAdmin.from("projects") as any)
          .select("id").eq("slug", baseSlug).limit(1);
        const slug = existing && existing.length > 0
          ? `${baseSlug}-${Date.now().toString(36)}`
          : baseSlug;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseAdmin.from("projects") as any).insert({
          name: args.name,
          slug,
          user_id: context.userId,
          category: args.category ?? "AI",
          priority: args.priority ?? "Scheduled",
          status: args.status ?? "active",
          agent: "Dash",
          description: args.description ?? null,
          expected_result: args.expected_result ?? null,
          github_repo: args.github_repo ?? null,
          completion_pct: 0,
        }).select().single();
        if (error) return `Error: ${error.message}`;
        return `Project created: ${JSON.stringify(data)}`;
      }

      case "update_project": {
        const { id, ...fields } = args;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from("projects") as any).update(fields).eq("id", id).eq("user_id", context.userId);
        if (error) return `Error: ${error.message}`;
        return `Project ${id} updated.`;
      }

      case "delete_project": {
        await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabaseAdmin.from("project_logs") as any).delete().eq("project_id", args.id).eq("user_id", context.userId),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabaseAdmin.from("project_steps") as any).delete().eq("project_id", args.id).eq("user_id", context.userId),
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from("projects") as any).delete().eq("id", args.id).eq("user_id", context.userId);
        if (error) return `Error: ${error.message}`;
        return `Project ${args.id} deleted.`;
      }

      case "create_step": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabaseAdmin.from("project_steps") as any)
          .select("*", { count: "exact", head: true })
          .eq("project_id", args.project_id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseAdmin.from("project_steps") as any).insert({
          project_id: args.project_id,
          user_id: context.userId,
          step_number: (count ?? 0) + 1,
          title: args.title,
          description: args.description ?? null,
          status: "pending",
        }).select().single();
        if (error) return `Error: ${error.message}`;
        await recalculateCompletion(args.project_id as string);
        return `Step created and completion_pct updated: ${JSON.stringify(data)}`;
      }

      case "update_step": {
        const resolved = await resolveStepId(args);
        if ("error" in resolved) return `Error: ${resolved.error}`;
        const resolvedStepId = resolved.id;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { step_id, step_number, step_title, project_id: _pid, ...fields } = args;
        void step_id; void step_number; void step_title; void _pid;
        const { error } = await (supabaseAdmin.from("project_steps") as any)
          .update(fields).eq("id", resolvedStepId);
        if (error) return `Error: ${error.message}`;

        if ("status" in fields) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: step } = await (supabaseAdmin.from("project_steps") as any)
            .select("project_id").eq("id", resolvedStepId).single() as { data: { project_id: string } | null };
          if (step) await recalculateCompletion(step.project_id);
        }
        return `Step ${resolvedStepId} updated.`;
      }

      case "delete_step": {
        const resolved = await resolveStepId(args);
        if ("error" in resolved) return `Error: ${resolved.error}`;
        const resolvedStepId = resolved.id;

        // Get project_id before deleting (for recalculation)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: stepRow } = await (supabaseAdmin.from("project_steps") as any)
          .select("project_id").eq("id", resolvedStepId).single() as { data: { project_id: string } | null };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from("project_steps") as any)
          .delete().eq("id", resolvedStepId);
        if (error) return `Error: ${error.message}`;

        if (stepRow) {
          await recalculateCompletion(stepRow.project_id);

          // Renumber remaining steps sequentially to close the gap
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: remaining } = await (supabaseAdmin.from("project_steps") as any)
            .select("id")
            .eq("project_id", stepRow.project_id)
            .order("step_number") as { data: { id: string }[] | null };

          if (remaining && remaining.length > 0) {
            await Promise.all(
              remaining.map((s, i) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (supabaseAdmin.from("project_steps") as any)
                  .update({ step_number: i + 1 })
                  .eq("id", s.id)
              )
            );
          }
        }

        return `Step ${resolvedStepId} deleted. Remaining steps renumbered sequentially.`;
      }

      case "move_step": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: steps } = await (supabaseAdmin.from("project_steps") as any)
          .select("id, step_number")
          .eq("project_id", args.project_id)
          .order("step_number") as { data: { id: string; step_number: number }[] | null };
        if (!steps) return "No steps found.";
        const idx = steps.findIndex((s) => s.id === args.step_id);
        const swapIdx = args.direction === "up" ? idx - 1 : idx + 1;
        if (idx === -1) return "Step not found.";
        if (swapIdx < 0 || swapIdx >= steps.length) return "Can't move further in that direction.";
        const a = steps[idx];
        const b = steps[swapIdx];
        await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabaseAdmin.from("project_steps") as any).update({ step_number: b.step_number }).eq("id", a.id),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabaseAdmin.from("project_steps") as any).update({ step_number: a.step_number }).eq("id", b.id),
        ]);
        return `Step moved ${args.direction}.`;
      }

      case "move_step_to": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: steps } = await (supabaseAdmin.from("project_steps") as any)
          .select("id, step_number")
          .eq("project_id", args.project_id)
          .order("step_number") as { data: { id: string; step_number: number }[] | null };

        if (!steps || steps.length === 0) return "No steps found for this project.";

        // Resolve the step to move
        const resolved = await resolveStepId(args);
        if ("error" in resolved) return `Error: ${resolved.error}`;
        const resolvedStepId = resolved.id;

        const currentIdx = steps.findIndex((s) => s.id === resolvedStepId);
        if (currentIdx === -1) return "Step not found in this project.";

        const target = Math.max(1, Math.min(steps.length, args.target_position as number));
        const targetIdx = target - 1;

        if (currentIdx === targetIdx) return `Step is already at position ${target}.`;

        const reordered = [...steps];
        const [moved] = reordered.splice(currentIdx, 1);
        reordered.splice(targetIdx, 0, moved);

        // Update all step_numbers
        await Promise.all(
          reordered.map((s, i) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabaseAdmin.from("project_steps") as any)
              .update({ step_number: i + 1 })
              .eq("id", s.id)
          )
        );

        return `Step moved to position ${target}. New order: ${reordered.map((s, i) => `${i + 1}:${s.id}`).join(", ")}`;
      }

      case "create_log": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseAdmin.from("project_logs") as any).insert({
          project_id: args.project_id,
          user_id: context.userId,
          summary: args.summary,
          agent: args.agent ?? "Dash",
          session_date: args.session_date ?? new Date().toISOString().split("T")[0],
          problems: args.problems ?? null,
          solutions: args.solutions ?? null,
          step_id: args.step_id ?? null,
          archived: false,
        }).select().single();
        if (error) return `Error: ${error.message}`;
        return `Log created: ${JSON.stringify(data)}`;
      }

      case "delete_log": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from("project_logs") as any)
          .delete().eq("id", args.log_id);
        if (error) return `Error: ${error.message}`;
        return `Log ${args.log_id} deleted.`;
      }

      case "create_link": {
        // Fetch real title from metadata (replaces generic AI-provided titles)
        let linkTitle = args.title as string;
        try {
          const meta = await fetchLinkMetadata(args.url as string);
          if (meta.title) linkTitle = meta.title;
        } catch { /* keep AI-provided title on fetch failure */ }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseAdmin.from("project_links") as any).insert({
          project_id: args.project_id,
          user_id: context.userId,
          title: linkTitle,
          url: args.url,
        }).select().single();
        if (error) return `Error: ${error.message}`;
        return `Link saved: ${JSON.stringify(data)}`;
      }

      case "list_links": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseAdmin.from("project_links") as any)
          .select("*").eq("project_id", args.project_id).order("created_at");
        if (error) return `Error: ${error.message}`;
        if (!data || data.length === 0) return "No links saved for this project.";
        return JSON.stringify(data);
      }

      case "delete_link": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from("project_links") as any)
          .delete().eq("id", args.link_id);
        if (error) return `Error: ${error.message}`;
        return `Link ${args.link_id} deleted.`;
      }

      // ── Personal saved links ─────────────────────────────────────────────────

      case "save_link": {
        const meta = await fetchLinkMetadata(args.url as string);
        const aiTags = Array.isArray(args.tags) ? (args.tags as string[]) : [];
        const mergedTags = Array.from(new Set([...aiTags, ...meta.tags])).slice(0, 6);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseAdmin.from("links") as any).insert({
          url:         args.url,
          user_id:     context.userId,
          title:       meta.title,
          description: meta.description,
          image_url:   meta.image_url,
          site_name:   meta.site_name,
          favicon_url: meta.favicon_url,
          source_type: meta.source_type,
          tags:        mergedTags,
          notes:       args.notes ?? null,
          is_read:     false,
        }).select().single();
        if (error) return `Error: ${error.message}`;
        return `Link saved: ${JSON.stringify(data)}`;
      }

      case "list_saved_links": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabaseAdmin.from("links") as any)
          .select("id, url, title, site_name, source_type, tags, is_read, created_at")
          .eq("user_id", context.userId)
          .order("created_at", { ascending: false })
          .limit(args.limit ?? 20);
        if (args.source_type) query = query.eq("source_type", args.source_type);
        if (typeof args.is_read === "boolean") query = query.eq("is_read", args.is_read);
        const { data, error } = await query;
        if (error) return `Error: ${error.message}`;
        if (!data || data.length === 0) return "No saved links found.";
        return JSON.stringify(data);
      }

      case "delete_saved_link": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from("links") as any)
          .delete().eq("id", args.link_id).eq("user_id", context.userId);
        if (error) return `Error: ${error.message}`;
        return `Link ${args.link_id} deleted.`;
      }

      case "mark_link_read": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from("links") as any)
          .update({ is_read: args.is_read }).eq("id", args.link_id).eq("user_id", context.userId);
        if (error) return `Error: ${error.message}`;
        return `Link ${args.link_id} marked as ${args.is_read ? "read" : "unread"}.`;
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (e) {
    return `Unexpected error: ${String(e)}`;
  }
}
