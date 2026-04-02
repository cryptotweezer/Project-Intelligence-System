import { supabaseAdmin } from "@/lib/supabase/admin";
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
          priority: { type: "string", enum: ["Urgent", "Normal", "Someday"] },
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
          priority: { type: "string", enum: ["Urgent", "Normal", "Someday"] },
          status: { type: "string", enum: ["active", "paused"] },
          agent: { type: "string", enum: ["Claude", "Emma", "Both", "Dash"] },
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
          priority: { type: "string", enum: ["Urgent", "Normal", "Someday"] },
          status: { type: "string", enum: ["active", "paused", "done", "archived"] },
          agent: { type: "string", enum: ["Claude", "Emma", "Both", "Dash"] },
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
      description: "Update a step's status, title, description, or notes. Automatically recalculates project completion_pct when status changes.",
      parameters: {
        type: "object",
        required: ["step_id"],
        properties: {
          step_id: { type: "string" },
          status: { type: "string", enum: ["pending", "in_progress", "done", "error"] },
          title: { type: "string" },
          description: { type: "string" },
          notes: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_step",
      description: "Delete a step. Automatically recalculates project completion_pct.",
      parameters: {
        type: "object",
        required: ["step_id"],
        properties: {
          step_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_step",
      description: "Move a step up or down in the project's step order.",
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

export async function executeTool(name: string, args: Args): Promise<string> {
  try {
    switch (name) {

      case "list_projects": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabaseAdmin.from("projects") as any)
          .select("id, name, priority, status, completion_pct, agent");
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
          const res = await (supabaseAdmin.from("projects") as any).select("*").eq("id", args.id).limit(1);
          projects = res.data;
          pErr = res.error;
        } else {
          // Try exact match first, then partial — most recent wins
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const exact = await (supabaseAdmin.from("projects") as any).select("*")
            .ilike("name", args.name as string).limit(1);
          if (exact.data && exact.data.length > 0) {
            projects = exact.data;
            pErr = exact.error;
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const partial = await (supabaseAdmin.from("projects") as any).select("*")
              .ilike("name", `%${args.name}%`)
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseAdmin.from("projects") as any).insert({
          name: args.name,
          category: args.category ?? "AI",
          priority: args.priority ?? "Normal",
          status: args.status ?? "active",
          agent: args.agent ?? "Claude",
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
        const { error } = await (supabaseAdmin.from("projects") as any).update(fields).eq("id", id);
        if (error) return `Error: ${error.message}`;
        return `Project ${id} updated.`;
      }

      case "delete_project": {
        await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabaseAdmin.from("project_logs") as any).delete().eq("project_id", args.id),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabaseAdmin.from("project_steps") as any).delete().eq("project_id", args.id),
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from("projects") as any).delete().eq("id", args.id);
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
        const { step_id, ...fields } = args;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from("project_steps") as any)
          .update(fields).eq("id", step_id);
        if (error) return `Error: ${error.message}`;

        // Recalculate if status changed
        if ("status" in fields) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: step } = await (supabaseAdmin.from("project_steps") as any)
            .select("project_id").eq("id", step_id).single() as { data: { project_id: string } | null };
          if (step) await recalculateCompletion(step.project_id);
        }
        return `Step ${step_id} updated.`;
      }

      case "delete_step": {
        // Get project_id before deleting
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: step } = await (supabaseAdmin.from("project_steps") as any)
          .select("project_id").eq("id", args.step_id).single() as { data: { project_id: string } | null };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from("project_steps") as any)
          .delete().eq("id", args.step_id);
        if (error) return `Error: ${error.message}`;
        if (step) await recalculateCompletion(step.project_id);
        return `Step ${args.step_id} deleted and completion_pct updated.`;
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

      case "create_log": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseAdmin.from("project_logs") as any).insert({
          project_id: args.project_id,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseAdmin.from("project_links") as any).insert({
          project_id: args.project_id,
          title: args.title,
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

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (e) {
    return `Unexpected error: ${String(e)}`;
  }
}
