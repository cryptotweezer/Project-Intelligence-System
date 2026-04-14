// ── Database Types (matches Supabase schema) ──────────────────────────

export type ProjectPriority = "Urgent" | "Scheduled" | "Someday" | (string & {});
export type ProjectAgent = "Claude" | "Emma" | "Dash" | "All";
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

// ── Resume Project Types ───────────────────────────────────────────────

export interface ContactLead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  created_at: string | null;
}

export interface ResumeUser {
  id: number;
  email: string;
  name: string | null;
  clerk_id: string;
  role: string;
  is_first_user: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}
