"use client";

import { useState, useTransition } from "react";
import type { Project, ProjectStep, ProjectLog } from "@/lib/types";
import DeleteProjectButton from "@/app/dashboard/DeleteProjectButton";
import { reactivateProject } from "@/app/actions/overview";

type Props = {
  project: Project & { project_steps: ProjectStep[]; project_logs: ProjectLog[] };
  expanded: boolean;
  dimmed: boolean;
  onToggle: () => void;
};

const tinyBadge: React.CSSProperties = { fontSize: "0.45rem", padding: "0.1rem 0.35rem", letterSpacing: "0.08em" };

function PriorityBadge({ priority }: { priority: string }) {
  const cls = priority === "Urgent" ? "badge badge-urgent" : priority === "Scheduled" ? "badge badge-normal" : priority === "Someday" ? "badge badge-someday" : "badge badge-custom";
  return <span className={cls} style={tinyBadge}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`} style={tinyBadge}>{status}</span>;
}

function StepDot({ status }: { status: string }) {
  const colors: Record<string, string> = { pending: "#8b91a0", in_progress: "#d1bcff", done: "#3b82f6", error: "#ffb2be" };
  return (
    <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: colors[status] ?? "#8b91a0", flexShrink: 0 }} />
  );
}

export default function CompletedCard({ project, expanded, dimmed, onToggle }: Props) {
  const [isPending, startTransition] = useTransition();
  const steps = (project.project_steps ?? []).sort((a, b) => a.step_number - b.step_number);
  const logs = (project.project_logs ?? []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const lastLog = logs[0] ?? null;
  const stepsDone = steps.filter((s) => s.status === "done").length;
  const stepsPending = steps.filter((s) => s.status !== "done").length;
  const pct = project.completion_pct ?? 0;

  function handleReactivate() {
    startTransition(() => reactivateProject(project.id));
  }

  function handleToggle() {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    onToggle();
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderLeft: "2px solid rgba(59,130,246,0.2)",
        opacity: dimmed ? 0.35 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Header */}
      <div
        onClick={handleToggle}
        className="w-full px-5 py-4 group"
        style={{ cursor: "pointer", userSelect: "text" }}
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-label text-outline" style={{ fontSize: "0.48rem", letterSpacing: "0.15em" }}>
            {project.category}
          </span>
          <PriorityBadge priority={project.priority} />
          <StatusBadge status={project.status} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2
            className="font-display"
            style={{ fontSize: "0.95rem", letterSpacing: "-0.01em", color: "var(--accent-dim)" }}
          >
            {project.name}
          </h2>
          <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleReactivate}
              disabled={isPending}
              className="font-label"
              title="Move back to active projects"
              style={{
                fontSize: "0.48rem",
                letterSpacing: "0.1em",
                color: isPending ? "var(--text-dim)" : "#22d3ee",
                background: "transparent",
                border: "none",
                cursor: isPending ? "not-allowed" : "pointer",
                padding: "2px 0",
                opacity: isPending ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {isPending ? "..." : "↩ REACTIVATE"}
            </button>
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
              redirectTo="/dashboard/completed"
            />
            <span className="font-label text-outline" style={{ fontSize: "0.5rem" }}>
              {expanded ? "▲" : "▼"}
            </span>
          </div>
        </div>

        {project.description && (
          <p className="text-outline font-light mt-2 mb-2" style={{ fontSize: "0.72rem", lineHeight: "1.45" }}>
            {project.description.split("\n")[0]}
          </p>
        )}

        <div className="mt-1 mb-2 flex items-center gap-3">
          <div className="flex-1 progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-label text-electric-blue flex-shrink-0" style={{ fontSize: "0.48rem" }}>{pct}%</span>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-label" style={{ fontSize: "0.45rem", letterSpacing: "0.12em", color: "var(--text-primary)" }}>
            ASSIGNED · {project.agent.toUpperCase()}
          </span>
          <span className="font-label" style={{ fontSize: "0.48rem", letterSpacing: "0.1em", color: "#3b82f6" }}>
            DONE {stepsDone}
          </span>
          <span className="font-label" style={{ fontSize: "0.48rem", letterSpacing: "0.1em", color: "var(--text-primary)" }}>
            PENDING {stepsPending}
          </span>
          {lastLog && (
            <span className="font-label text-outline" style={{ fontSize: "0.45rem", letterSpacing: "0.1em" }}>
              LAST SESSION · {new Date(lastLog.session_date).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* Expanded body — read-only */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border-faint)", userSelect: "text" }}>
          <div className="px-5 py-4">

            {project.description && project.description.includes("\n") && (
              <p className="text-outline font-light text-sm mb-4 leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
                {project.description}
              </p>
            )}

            {project.expected_result && (
              <div className="mb-4 p-3" style={{ background: "var(--bg-expected)", borderLeft: "2px solid rgba(59,130,246,0.2)" }}>
                <div className="font-label text-outline mb-1" style={{ fontSize: "0.48rem", letterSpacing: "0.15em" }}>
                  EXPECTED RESULT
                </div>
                <p className="text-outline font-light text-xs leading-relaxed">{project.expected_result}</p>
              </div>
            )}

            {steps.length > 0 && (
              <div className="mb-4">
                <div className="font-label text-outline mb-2" style={{ fontSize: "0.48rem", letterSpacing: "0.15em" }}>STEPS</div>
                <div className="space-y-1.5">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <StepDot status={step.status} />
                      <span
                        className="font-light text-xs truncate"
                        style={{ color: step.status === "done" ? "var(--accent-dim)" : "var(--text-secondary)" }}
                      >
                        {step.step_number}. {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All logs — scrollable */}
            {logs.length > 0 && (
              <div className="pt-3" style={{ borderTop: "1px solid var(--border-faint)" }}>
                <div className="font-label text-outline mb-3" style={{ fontSize: "0.48rem", letterSpacing: "0.15em" }}>
                  SESSION LOGS · {logs.length}
                </div>
                <div className="space-y-3" style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
                  {logs.map((log, i) => (
                    <div
                      key={log.id}
                      className="pb-3"
                      style={{ borderBottom: i < logs.length - 1 ? "1px solid var(--border-faint)" : "none" }}
                    >
                      <div className="font-label text-outline mb-1" style={{ fontSize: "0.45rem", letterSpacing: "0.12em" }}>
                        {new Date(log.session_date).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
                        {" · "}{log.agent}
                      </div>
                      <p className="text-outline font-light text-xs leading-relaxed">{log.summary}</p>
                      {log.problems && (
                        <div className="mt-1">
                          <span className="font-label" style={{ fontSize: "0.43rem", color: "var(--label-problems)" }}>PROBLEMS: </span>
                          <span className="text-outline font-light text-xs">{log.problems}</span>
                        </div>
                      )}
                      {log.solutions && (
                        <div className="mt-0.5">
                          <span className="font-label" style={{ fontSize: "0.43rem", color: "var(--label-solutions)" }}>SOLUTIONS: </span>
                          <span className="text-outline font-light text-xs">{log.solutions}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.github_repo && (
              <div className="flex justify-end mt-3 pt-3" style={{ borderTop: "1px solid var(--border-faint)" }}>
                <a
                  href={project.github_repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-label text-electric-blue hover:underline"
                  style={{ fontSize: "0.5rem", letterSpacing: "0.1em" }}
                >
                  GITHUB →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
