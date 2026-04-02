// ── Database Types (matches Supabase schema) ──────────────────────────

export type ProjectPriority = "Urgent" | "Normal" | "Someday";
export type ProjectAgent = "Claude" | "Emma" | "Both" | "Dash";
export type ProjectStatus = "active" | "paused" | "done" | "archived";
export type StepStatus = "pending" | "in_progress" | "done" | "error";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  expected_result: string | null;
  category: string;
  priority: ProjectPriority;
  agent: ProjectAgent;
  github_repo: string | null;
  status: ProjectStatus;
  completion_pct: number | null;
  created_at: string;
}

export interface ProjectStep {
  id: string;
  project_id: string;
  step_number: number;
  title: string;
  description: string | null;
  status: StepStatus;
  notes: string | null;
  created_at: string;
}

export interface ProjectLog {
  id: string;
  project_id: string;
  step_id: string | null;
  agent: string;
  session_date: string;
  summary: string;
  problems: string | null;
  solutions: string | null;
  archived: boolean;
  created_at: string;
}

export interface ProjectLink {
  id: string;
  project_id: string;
  title: string;
  url: string;
  created_at: string;
}

export interface AgentLog {
  id: string;
  agent_name: string | null;
  task_description: string | null;
  model_used: string | null;
  status: string | null;
  created_at: string | null;
  progress_pct: number | null;
}
