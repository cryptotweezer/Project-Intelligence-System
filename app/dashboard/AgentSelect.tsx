"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { updateProjectAgent } from "@/app/actions/overview";

export default function AgentSelect({
  projectId,
  currentAgent,
}: {
  projectId: string;
  currentAgent: string;
}) {
  const [editing, setEditing] = useState(false);
  const [optimistic, setOptimistic] = useState(currentAgent || "");
  const [draft, setDraft] = useState(currentAgent || "");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOptimistic(currentAgent || "");
    setDraft(currentAgent || "");
  }, [currentAgent]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    const value = draft.trim();
    setEditing(false);
    if (value === optimistic) return;
    setOptimistic(value);
    startTransition(() => updateProjectAgent(projectId, value));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      setDraft(optimistic);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <div style={{ display: "inline-block" }} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Claude Code"
          className="font-label"
          style={{
            background: "none",
            border: "none",
            borderBottom: "1px solid var(--border)",
            outline: "none",
            padding: "0 2px",
            fontSize: "0.45rem",
            letterSpacing: "0.12em",
            color: "var(--text-primary)",
            width: "90px",
          }}
        />
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
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
      title="Click to edit"
    >
      AGENT · {optimistic ? optimistic.toUpperCase() : "—"}
    </button>
  );
}
