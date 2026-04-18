"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createStep } from "@/app/actions/overview";

export default function CreateStepForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Focus title input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 50);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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

  return (
    <>
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
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(209,188,255,0.85)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(209,188,255,0.5)")}
      >
        + ADD STEP
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 16px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="animate-fade-in"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              padding: "24px 20px",
              width: "100%",
              maxWidth: "480px",
            }}
          >
            <div className="font-label text-outline mb-5" style={{ fontSize: "0.5rem", letterSpacing: "0.25em" }}>
              NEW STEP
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div className="font-label text-outline mb-1.5" style={{ fontSize: "0.45rem", letterSpacing: "0.15em" }}>
                  TITLE *
                </div>
                <input
                  ref={titleRef}
                  type="text"
                  placeholder="What needs to be done?"
                  required
                  className="obsidian-input"
                  style={{ fontSize: "16px", padding: "8px 12px", width: "100%" }}
                />
              </div>

              <div>
                <div className="font-label text-outline mb-1.5" style={{ fontSize: "0.45rem", letterSpacing: "0.15em" }}>
                  DESCRIPTION
                </div>
                <textarea
                  ref={descRef}
                  placeholder="Optional context or notes for this step..."
                  rows={3}
                  className="obsidian-input"
                  style={{ fontSize: "16px", padding: "8px 12px", resize: "vertical", width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center", paddingTop: "4px" }}>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary"
                  style={{ flex: 1, opacity: isPending ? 0.5 : 1 }}
                >
                  {isPending ? "SAVING..." : "SAVE STEP"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="font-label"
                  style={{
                    fontSize: "0.55rem",
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                    background: "none",
                    border: "1px solid var(--border)",
                    padding: "8px 16px",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
