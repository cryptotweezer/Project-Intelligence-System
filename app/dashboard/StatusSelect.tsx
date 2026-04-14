"use client";

import { useState, useEffect, useTransition } from "react";
import { updateProjectStatus } from "@/app/actions/overview";

const STATUS_OPTIONS = ["active", "paused"];

function badgeClass(status: string) {
  return `badge badge-${status}`;
}

export default function StatusSelect({
  projectId,
  currentStatus,
}: {
  projectId: string;
  currentStatus: string;
}) {
  const [open, setOpen] = useState(false);
  const [optimistic, setOptimistic] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOptimistic(currentStatus);
  }, [currentStatus]);

  function select(status: string) {
    setOptimistic(status);
    setOpen(false);
    startTransition(() => updateProjectStatus(projectId, status));
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          verticalAlign: "middle",
          lineHeight: 1,
        }}
      >
        <span className={badgeClass(optimistic)} style={{ opacity: isPending ? 0.5 : 1 }}>
          {optimistic}
        </span>
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
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => select(opt)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: opt === optimistic ? "var(--bg-nav-active)" : "transparent",
                border: "none",
                padding: "7px 12px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { if (opt !== optimistic) e.currentTarget.style.background = "var(--bg-input)"; }}
              onMouseLeave={(e) => { if (opt !== optimistic) e.currentTarget.style.background = "transparent"; }}
            >
              <span className={badgeClass(opt)} style={{ fontSize: "0.45rem", padding: "0.1rem 0.35rem", letterSpacing: "0.08em" }}>
                {opt}
              </span>
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
