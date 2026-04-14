"use client";

import { useState, useTransition, useRef } from "react";
import { createStep } from "@/app/actions/overview";

export default function CreateStepForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const title = titleRef.current?.value.trim() ?? "";
    const desc = descRef.current?.value.trim() ?? "";
    if (!title) return;

    startTransition(async () => {
      await createStep(projectId, title, desc);
      setOpen(false);
      if (titleRef.current) titleRef.current.value = "";
      if (descRef.current) descRef.current.value = "";
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-label transition-colors duration-150"
        style={{
          fontSize: "0.55rem",
          letterSpacing: "0.1em",
          color: "rgba(209,188,255,0.5)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        + ADD STEP
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
      <input
        ref={titleRef}
        type="text"
        placeholder="Step title"
        required
        autoFocus
        className="obsidian-input"
        style={{ fontSize: "0.75rem", padding: "5px 8px" }}
      />
      <textarea
        ref={descRef}
        placeholder="Description (optional)"
        rows={2}
        className="obsidian-input"
        style={{ fontSize: "0.7rem", padding: "5px 8px", resize: "none" }}
      />
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          type="submit"
          disabled={isPending}
          className="font-label"
          style={{
            fontSize: "0.55rem",
            letterSpacing: "0.1em",
            color: isPending ? "rgba(209,188,255,0.3)" : "rgba(209,188,255,0.8)",
            background: "none",
            border: "1px solid rgba(209,188,255,0.2)",
            padding: "3px 8px",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "SAVING..." : "SAVE"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-label"
          style={{
            fontSize: "0.55rem",
            letterSpacing: "0.1em",
            color: "var(--text-dim)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
