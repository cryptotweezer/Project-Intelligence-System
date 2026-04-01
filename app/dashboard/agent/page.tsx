import { createClient } from "@/lib/supabase/server";
import type { AgentLog } from "@/lib/types";

function ModelBadge({ model }: { model: string | null }) {
  if (!model) return null;
  return (
    <span
      className="font-label px-2 py-0.5"
      style={{
        fontSize: "0.55rem",
        letterSpacing: "0.1em",
        border: "1px solid rgba(209,188,255,0.3)",
        color: "#d1bcff",
        background: "rgba(209,188,255,0.04)",
      }}
    >
      {model.toUpperCase()}
    </span>
  );
}

function StatusLabel({ status }: { status: string | null }) {
  if (!status) return null;
  const color =
    status === "error"
      ? "#ffb2be"
      : status === "running"
      ? "#d1bcff"
      : status === "done"
      ? "#3b82f6"
      : "#8b91a0";
  return (
    <span
      className="font-label"
      style={{ fontSize: "0.55rem", letterSpacing: "0.1em", color }}
    >
      {status.toUpperCase()}
    </span>
  );
}

function AgentProgressBar({ pct }: { pct: number | null }) {
  const value = pct ?? 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="font-label text-outline" style={{ fontSize: "0.52rem", letterSpacing: "0.1em" }}>
          PROGRESS
        </span>
        <span className="font-label" style={{ fontSize: "0.52rem", color: "#d1bcff" }}>
          {value}%
        </span>
      </div>
      <div className="progress-track">
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: "linear-gradient(90deg, #7000ff, #d1bcff)",
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

export default async function AgentMonitorPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agent_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(150);

  const logs = (data || []) as AgentLog[];

  const total = logs.length;
  const running = logs.filter((l) => l.status === "running").length;
  const errored = logs.filter((l) => l.status === "error").length;

  return (
    <div className="p-10 animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <div className="font-label text-outline mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.25em" }}>
          REAL-TIME INTELLIGENCE
        </div>
        <h1 className="font-display text-3xl text-white" style={{ letterSpacing: "-0.02em" }}>
          Agent Monitor
        </h1>
        <div className="mt-3" style={{ width: "60px", height: "1px", background: "linear-gradient(90deg, rgba(209,188,255,0.5), transparent)" }} />
      </div>

      {/* Quick stats */}
      <div className="flex gap-6 mb-10">
        <div>
          <div className="font-label text-outline mb-1" style={{ fontSize: "0.55rem", letterSpacing: "0.15em" }}>TOTAL EVENTS</div>
          <div className="font-display text-white" style={{ fontSize: "1.8rem", letterSpacing: "-0.02em" }}>
            {total.toLocaleString()}
          </div>
        </div>
        <div style={{ width: "1px", background: "rgba(65,71,84,0.3)" }} />
        <div>
          <div className="font-label mb-1" style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#d1bcff" }}>RUNNING</div>
          <div className="font-display" style={{ fontSize: "1.8rem", letterSpacing: "-0.02em", color: "#d1bcff" }}>
            {running}
          </div>
        </div>
        <div style={{ width: "1px", background: "rgba(65,71,84,0.3)" }} />
        <div>
          <div className="font-label mb-1" style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#ffb2be" }}>ERRORS</div>
          <div className="font-display" style={{ fontSize: "1.8rem", letterSpacing: "-0.02em", color: "#ffb2be" }}>
            {errored}
          </div>
        </div>
      </div>

      {error && (
        <div className="font-label text-ruby-red mb-6" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>
          ERROR: {error.message}
        </div>
      )}

      {(!logs || logs.length === 0) ? (
        <div className="p-12 text-center" style={{ border: "1px solid rgba(65,71,84,0.2)" }}>
          <div className="font-label text-outline" style={{ fontSize: "0.65rem", letterSpacing: "0.2em" }}>
            NO AGENT EVENTS
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {(logs as AgentLog[]).map((log) => (
            <div
              key={log.id}
              className="p-5 transition-all duration-150"
              style={{
                background: "rgba(14,14,14,0.7)",
                border: "1px solid rgba(65,71,84,0.18)",
                borderLeft:
                  log.status === "error"
                    ? "2px solid rgba(255,178,190,0.5)"
                    : log.status === "running"
                    ? "2px solid rgba(209,188,255,0.4)"
                    : "2px solid rgba(65,71,84,0.2)",
              }}
            >
              {/* Top row */}
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-label text-white" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>
                    {log.agent_name ?? "UNKNOWN AGENT"}
                  </span>
                  <ModelBadge model={log.model_used} />
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusLabel status={log.status} />
                  <span className="font-label text-outline" style={{ fontSize: "0.52rem", letterSpacing: "0.08em" }}>
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString("en-AU", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Task description */}
              {log.task_description && (
                <p className="text-outline font-light text-sm leading-relaxed mb-3">
                  {log.task_description}
                </p>
              )}

              {/* Progress */}
              {log.progress_pct !== null && (
                <AgentProgressBar pct={log.progress_pct} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
