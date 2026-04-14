"use client";

import { useState, useEffect, useTransition } from "react";
import { updateProjectAgent } from "@/app/actions/overview";

const AGENT_OPTIONS = ["Claude", "Emma", "Dash", "All"];

export default function AgentSelect({
  projectId,
  currentAgent,
}: {
  projectId: string;
  currentAgent: string;
}) {
  const [open, setOpen] = useState(false);
  const [optimistic, setOptimistic] = useState(currentAgent);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOptimistic(currentAgent);
  }, [currentAgent]);

  function select(agent: string) {
    setOptimistic(agent);
    setOpen(false);
    startTransition(() => updateProjectAgent(projectId, agent));
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="font-label"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: "0.45rem",
          letterSpacing: "0.12em",
          color: isPending ? "var(--text-dim)" : "var(--text-primary)",
        }}
      >
        ASSIGNED · {optimistic.toUpperCase()}
      </button>

      {open && (
        <div
          className="animate-fade-in"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 100,
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            minWidth: "110px",
            padding: "4px 0",
          }}
        >
          {AGENT_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => select(opt)}
              className="font-label"
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: opt === optimistic ? "var(--bg-nav-active)" : "transparent",
                border: "none",
                padding: "7px 12px",
                cursor: "pointer",
                fontSize: "0.45rem",
                letterSpacing: "0.1em",
                color: opt === optimistic ? "var(--text-primary)" : "var(--text-secondary)",
              }}
              onMouseEnter={(e) => { if (opt !== optimistic) e.currentTarget.style.background = "var(--bg-input)"; }}
              onMouseLeave={(e) => { if (opt !== optimistic) e.currentTarget.style.background = "transparent"; }}
            >
              {opt.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
