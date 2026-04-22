import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Project, ProjectStep, ProjectLog, ProjectLink } from "@/lib/types";
import DeleteProjectButton from "@/app/dashboard/DeleteProjectButton";
import DeleteLogButton from "@/app/dashboard/DeleteLogButton";
import DeleteLinkButton from "@/app/dashboard/DeleteLinkButton";
import CreateStepForm from "@/app/dashboard/CreateStepForm";
import EditableField from "@/app/dashboard/EditableField";
import MarkCompleteButton from "@/app/dashboard/MarkCompleteButton";
import PrioritySelect from "@/app/dashboard/PrioritySelect";
import StatusSelect from "@/app/dashboard/StatusSelect";
import AgentSelect from "@/app/dashboard/AgentSelect";
import StepsList from "@/app/dashboard/StepsList";
import DeleteNoteButton from "@/app/dashboard/DeleteNoteButton";

function PriorityBadge({ priority }: { priority: string }) {
  const cls =
    priority === "Urgent"
      ? "badge badge-urgent"
      : priority === "Scheduled"
      ? "badge badge-normal"
      : priority === "Someday"
      ? "badge badge-someday"
      : "badge badge-custom";
  return <span className={cls}>{priority}</span>;
}


export default async function ProjectDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Fetch project by slug, scoped to current user
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", params.slug)
    .eq("user_id", user.id)
    .single();

  if (!project) notFound();

  const p = project as Project;

  const [{ data: steps }, { data: logs }, { data: links }, { data: notes }] = await Promise.all([
    supabase
      .from("project_steps")
      .select("*")
      .eq("project_id", p.id)
      .order("step_number"),
    supabase
      .from("project_logs")
      .select("*")
      .eq("project_id", p.id)
      .order("created_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("project_links") as any)
      .select("*")
      .eq("project_id", p.id)
      .order("created_at"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("project_notes") as any)
      .select("*")
      .eq("project_id", p.id)
      .order("created_at", { ascending: false }),
  ]);

  const stepList = (steps ?? []) as ProjectStep[];
  const logList = (logs ?? []) as ProjectLog[];
  const linkList = (links ?? []) as ProjectLink[];
  const noteList = (notes ?? []) as { id: string; title: string | null; content: string; agent: string; created_at: string }[];
  const pct = p.completion_pct ?? 0;
  const stepsDone = stepList.filter((s) => s.status === "done").length;
  const stepsPending = stepList.filter((s) => s.status !== "done").length;

  return (
    <div className="p-4 sm:p-6 md:p-10 animate-fade-in">
      {/* Back */}
      <Link
        href="/dashboard/projects"
        className="font-label text-outline hover:text-electric-blue transition-colors duration-150 mb-8 inline-block"
        style={{ fontSize: "0.55rem", letterSpacing: "0.15em" }}
      >
        ← PROJECTS
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="font-label text-outline mb-1" style={{ fontSize: "0.5rem", letterSpacing: "0.2em" }}>
          {p.category}
        </div>
        <h1 className="font-display text-3xl mb-4" style={{ letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          {p.name}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <PrioritySelect projectId={p.id} currentPriority={p.priority} />
          <StatusSelect projectId={p.id} currentStatus={p.status} />
          <AgentSelect projectId={p.id} currentAgent={p.agent} />
          {p.github_repo && (
            <a
              href={p.github_repo}
              target="_blank"
              rel="noopener noreferrer"
              className="font-label text-electric-blue hover:underline"
              style={{ fontSize: "0.5rem", letterSpacing: "0.1em" }}
            >
              GITHUB →
            </a>
          )}
        </div>
        <div className="mt-4" style={{ width: "60px", height: "1px", background: "linear-gradient(90deg, rgba(59,130,246,0.5), transparent)" }} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: info + steps */}
        <div className="xl:col-span-2 space-y-6">

          {/* Description — editable */}
          <div
            className="p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="font-label text-outline mb-3" style={{ fontSize: "0.5rem", letterSpacing: "0.2em" }}>
              DESCRIPTION
            </div>
            <EditableField
              projectId={p.id}
              field="description"
              value={p.description}
              placeholder="Click to add a description..."
            />
          </div>

          {/* Expected Result — editable */}
          <div
            className="p-5"
            style={{ background: "var(--bg-expected)", border: "1px solid rgba(59,130,246,0.15)" }}
          >
            <div className="font-label text-electric-blue mb-3" style={{ fontSize: "0.5rem", letterSpacing: "0.2em" }}>
              EXPECTED RESULT
            </div>
            <EditableField
              projectId={p.id}
              field="expected_result"
              value={p.expected_result}
              placeholder="Click to define the expected result..."
            />
          </div>

          {/* Notes */}
          <div
            className="p-5"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(209,188,255,0.12)" }}
          >
            <div className="font-label mb-4" style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "#d1bcff" }}>
              NOTES
            </div>
            {noteList.length === 0 ? (
              <p className="font-light text-xs" style={{ color: "var(--text-dim)" }}>
                No notes yet. Ask Dash to save research, findings, or insights from your conversations.
              </p>
            ) : (
              <div className="space-y-5" style={{ maxHeight: "480px", overflowY: "auto", paddingRight: "4px" }}>
                {noteList.map((note, i) => (
                  <div
                    key={note.id}
                    className="pb-5"
                    style={{ borderBottom: i < noteList.length - 1 ? "1px solid var(--border-faint)" : "none" }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        {note.title && (
                          <div className="font-label mb-1" style={{ fontSize: "0.58rem", letterSpacing: "0.06em", color: "var(--text-primary)" }}>
                            {note.title}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-label" style={{ fontSize: "0.45rem", letterSpacing: "0.1em", color: "#d1bcff", opacity: 0.7 }}>
                            {note.agent}
                          </span>
                          <span className="font-label text-outline" style={{ fontSize: "0.45rem", letterSpacing: "0.08em" }}>
                            {new Date(note.created_at).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <DeleteNoteButton noteId={note.id} projectSlug={params.slug} />
                    </div>
                    <p className="font-light text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress */}
          <div
            className="p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="font-label text-outline" style={{ fontSize: "0.5rem", letterSpacing: "0.2em" }}>
                PROGRESS
              </div>
              <div className="flex gap-4">
                <span className="font-label" style={{ fontSize: "0.5rem", letterSpacing: "0.1em", color: "rgba(59,130,246,0.7)" }}>
                  {stepsDone} DONE
                </span>
                <span className="font-label" style={{ fontSize: "0.5rem", letterSpacing: "0.1em", color: "var(--text-primary)" }}>
                  {stepsPending} PENDING
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-label text-outline" style={{ fontSize: "0.5rem" }}>COMPLETION</span>
              <span className="font-label text-electric-blue" style={{ fontSize: "0.5rem" }}>{pct}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>

            {pct === 100 && !["done", "archived"].includes(p.status) && (
              <div style={{ marginTop: "16px" }}>
                <MarkCompleteButton projectId={p.id} />
              </div>
            )}
          </div>

          {/* Steps */}
          <div
            className="p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-label text-outline" style={{ fontSize: "0.5rem", letterSpacing: "0.2em" }}>
                STEPS
              </div>
              <CreateStepForm projectId={p.id} />
            </div>

            <StepsList steps={stepList} projectId={p.id} />
          </div>
        </div>

        {/* Right column: logs + links + danger */}
        <div className="space-y-4">
          <div
            className="p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-label text-outline" style={{ fontSize: "0.5rem", letterSpacing: "0.2em" }}>
                SESSION LOGS
              </div>
              <span className="font-label text-outline" style={{ fontSize: "0.5rem" }}>
                {logList.length}
              </span>
            </div>

            {logList.length === 0 ? (
              <p className="text-outline font-light text-sm">No sessions logged yet.</p>
            ) : (
              <div
                className="space-y-4"
                style={{ maxHeight: "520px", overflowY: "auto", paddingRight: "4px" }}
              >
                {logList.map((log, i) => (
                  <div
                    key={log.id}
                    className="pb-4"
                    style={{ borderBottom: i < logList.length - 1 ? "1px solid var(--border-faint)" : "none" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-label text-outline" style={{ fontSize: "0.48rem", letterSpacing: "0.12em" }}>
                          {new Date(log.session_date).toLocaleDateString("en-AU", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="font-label" style={{ fontSize: "0.45rem", letterSpacing: "0.1em", color: "var(--label-agent)" }}>
                          {log.agent}
                        </div>
                      </div>
                      <DeleteLogButton logId={log.id} projectId={p.id} />
                    </div>
                    <p className="font-light text-xs leading-relaxed mb-2" style={{ color: "var(--text-primary)" }}>{log.summary}</p>
                    {log.problems && (
                      <div className="mb-1">
                        <span className="font-label" style={{ fontSize: "0.45rem", letterSpacing: "0.1em", color: "var(--label-problems)" }}>
                          PROBLEMS:{" "}
                        </span>
                        <span className="text-outline font-light text-xs">{log.problems}</span>
                      </div>
                    )}
                    {log.solutions && (
                      <div>
                        <span className="font-label" style={{ fontSize: "0.45rem", letterSpacing: "0.1em", color: "var(--label-solutions)" }}>
                          SOLUTIONS:{" "}
                        </span>
                        <span className="text-outline font-light text-xs">{log.solutions}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {linkList.length > 0 && (
            <div
              className="p-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="font-label text-outline mb-4" style={{ fontSize: "0.5rem", letterSpacing: "0.2em" }}>
                USEFUL LINKS
              </div>
              <div className="space-y-2">
                {linkList.map((link) => (
                  <div key={link.id} className="flex items-center justify-between gap-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-light text-xs hover:text-electric-blue transition-colors duration-150 truncate"
                      style={{ color: "rgba(59,130,246,0.75)" }}
                    >
                      {link.title}
                    </a>
                    <DeleteLinkButton linkId={link.id} projectId={p.id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="p-5"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(255,178,190,0.15)" }}
          >
            <div className="font-label text-ruby-red mb-4" style={{ fontSize: "0.5rem", letterSpacing: "0.2em" }}>
              DANGER ZONE
            </div>
            <DeleteProjectButton projectId={p.id} projectName={p.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
