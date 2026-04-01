"use client";

import { useRouter } from "next/navigation";
import type { Project, ProjectStep, ProjectLog } from "@/lib/types";

type Props = {
  project: Project & { project_steps: ProjectStep[]; project_logs: ProjectLog[] };
  expanded: boolean;
  dimmed: boolean;
  onToggle: () => void;
};

const tinyBadge: React.CSSProperties = { fontSize: "0.45rem", padding: "0.1rem 0.35rem", letterSpacing: "0.08em" };

function PriorityBadge({ priority }: { priority: string }) {
  const cls = priority === "Urgent" ? "badge badge-urgent" : priority === "Normal" ? "badge badge-normal" : "badge badge-someday";
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

export default function ProjectCard({ project, expanded, dimmed, onToggle }: Props) {
  const router = useRouter();

  const steps = (project.project_steps ?? []).sort((a, b) => a.step_number - b.step_number);
  const logs = (project.project_logs ?? []).sort(
    (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
  );
  const lastLog = logs[0] ?? null;
  const stepsDone = steps.filter((s) => s.status === "done").length;
  const stepsPending = steps.filter((s) => s.status !== "done").length;
  const pct = project.completion_pct ?? 0;

  const borderLeft =
    project.priority === "Urgent"
      ? "2px solid rgba(255,178,190,0.5)"
      : project.priority === "Normal"
      ? "2px solid rgba(59,130,246,0.3)"
      : "2px solid rgba(65,71,84,0.2)";

  function handleBodyClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("a")) return;
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    router.push(`/dashboard/projects/${project.id}`);
  }

  function handleHeaderClick() {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    onToggle();
  }

  return (
    <div
      style={{
        background: "rgba(14,14,14,0.8)",
        border: "1px solid rgba(65,71,84,0.2)",
        borderLeft,
        opacity: dimmed ? 0.35 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* ── Header — click to expand/collapse ── */}
      <div
        onClick={handleHeaderClick}
        className="w-full px-5 py-4 group"
        style={{ cursor: "pointer", userSelect: "text" }}
      >
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-label text-outline" style={{ fontSize: "0.48rem", letterSpacing: "0.15em" }}>
            {project.category}
          </span>
          <PriorityBadge priority={project.priority} />
          <StatusBadge status={project.status} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2
            className="font-display text-white group-hover:text-electric-blue transition-colors duration-150"
            style={{ fontSize: "0.95rem", letterSpacing: "-0.01em" }}
          >
            {project.name}
          </h2>
          <span className="font-label text-outline flex-shrink-0" style={{ fontSize: "0.5rem" }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>

        {/* Description snippet */}
        {project.description && (
          <p className="text-outline font-light mt-2 mb-2" style={{ fontSize: "0.72rem", lineHeight: "1.45" }}>
            {project.description.split("\n")[0]}
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-1 mb-2 flex items-center gap-3">
          <div className="flex-1 progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-label text-electric-blue flex-shrink-0" style={{ fontSize: "0.48rem" }}>{pct}%</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-label" style={{ fontSize: "0.45rem", letterSpacing: "0.12em", color: "rgba(209,188,255,0.45)" }}>
            ASSIGNED · {project.agent.toUpperCase()}
          </span>
          <span className="font-label" style={{ fontSize: "0.48rem", letterSpacing: "0.1em", color: "#3b82f6" }}>
            DONE {stepsDone}
          </span>
          <span className="font-label" style={{ fontSize: "0.48rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.9)" }}>
            PENDING {stepsPending}
          </span>
          {lastLog && (
            <span className="font-label text-outline" style={{ fontSize: "0.45rem", letterSpacing: "0.1em" }}>
              LAST SESSION · {new Date(lastLog.session_date).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* ── Expanded body — click anywhere to go to project page ── */}
      {expanded && (
        <div
          onClick={handleBodyClick}
          style={{ borderTop: "1px solid rgba(65,71,84,0.15)", cursor: "pointer", userSelect: "text" }}
        >
          <div className="px-5 py-4">

            {/* Full description if multi-paragraph */}
            {project.description && project.description.includes("\n") && (
              <p className="text-outline font-light text-sm mb-4 leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
                {project.description}
              </p>
            )}

            {/* Expected Result */}
            {project.expected_result && (
              <div className="mb-4 p-3" style={{ background: "rgba(59,130,246,0.04)", borderLeft: "2px solid rgba(59,130,246,0.2)" }}>
                <div className="font-label text-outline mb-1" style={{ fontSize: "0.48rem", letterSpacing: "0.15em" }}>
                  EXPECTED RESULT
                </div>
                <p className="text-outline font-light text-xs leading-relaxed">{project.expected_result}</p>
              </div>
            )}

            {/* Steps */}
            {steps.length > 0 && (
              <div className="mb-4">
                <div className="font-label text-outline mb-2" style={{ fontSize: "0.48rem", letterSpacing: "0.15em" }}>STEPS</div>
                <div className="space-y-1.5">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <StepDot status={step.status} />
                      <span
                        className="font-light text-xs truncate"
                        style={{ color: step.status === "done" ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.75)" }}
                      >
                        {step.step_number}. {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last session */}
            {lastLog && (
              <div className="mb-4 pt-3" style={{ borderTop: "1px solid rgba(65,71,84,0.15)" }}>
                <span className="font-label text-outline" style={{ fontSize: "0.48rem", letterSpacing: "0.12em" }}>
                  LAST SESSION — {new Date(lastLog.session_date).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                <p className="text-outline font-light mt-1 line-clamp-2" style={{ fontSize: "0.7rem", lineHeight: "1.4" }}>
                  {lastLog.summary}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(65,71,84,0.15)" }}>
              {project.github_repo ? (
                <a
                  href={project.github_repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-label text-electric-blue hover:underline"
                  style={{ fontSize: "0.5rem", letterSpacing: "0.1em" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  GITHUB →
                </a>
              ) : <span />}
              <span className="font-label text-electric-blue" style={{ fontSize: "0.5rem", letterSpacing: "0.1em" }}>
                VIEW PROJECT →
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
