"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { updateProjectPriority } from "@/app/actions/overview";

const PRESET_OPTIONS = ["Urgent", "Scheduled", "Someday"];

const DROPDOWN_BADGE_STYLE = { fontSize: "0.45rem", padding: "0.1rem 0.35rem", letterSpacing: "0.08em" };

function badgeClass(priority: string) {
  if (priority === "Urgent") return "badge badge-urgent";
  if (priority === "Scheduled") return "badge badge-normal";
  if (priority === "Someday") return "badge badge-someday";
  return "badge badge-custom";
}

export default function PrioritySelect({
  projectId,
  currentPriority,
}: {
  projectId: string;
  currentPriority: string;
}) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [optimistic, setOptimistic] = useState(currentPriority);
  const [isPending, startTransition] = useTransition();

  // Sync when server re-renders with updated value
  useEffect(() => {
    setOptimistic(currentPriority);
  }, [currentPriority]);
  const containerRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCustomMode(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus custom input when entering custom mode
  useEffect(() => {
    if (customMode) setTimeout(() => customInputRef.current?.focus(), 50);
  }, [customMode]);

  function select(priority: string) {
    setOptimistic(priority);
    setOpen(false);
    setCustomMode(false);
    startTransition(() => updateProjectPriority(projectId, priority));
  }

  function submitCustom() {
    const val = customValue.trim();
    if (!val) return;
    setCustomValue("");
    select(val);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") submitCustom();
    if (e.key === "Escape") { setOpen(false); setCustomMode(false); }
  }

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Badge trigger */}
      <button
        onClick={() => { setOpen((v) => !v); setCustomMode(false); }}
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
        <span
          className={badgeClass(optimistic)}
          style={{ opacity: isPending ? 0.5 : 1 }}
        >
          {optimistic}
        </span>
      </button>

      {/* Dropdown */}
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
            minWidth: "140px",
            padding: "4px 0",
          }}
        >
          {PRESET_OPTIONS.map((opt) => (
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
              <span className={badgeClass(opt)} style={DROPDOWN_BADGE_STYLE}>
                {opt}
              </span>
            </button>
          ))}

          {/* Divider */}
          <div style={{ height: "1px", background: "var(--border-subtle)", margin: "4px 0" }} />

          {/* Custom option */}
          {!customMode ? (
            <button
              onClick={() => setCustomMode(true)}
              className="font-label"
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "none",
                padding: "7px 12px",
                cursor: "pointer",
                fontSize: "0.45rem",
                letterSpacing: "0.1em",
                color: "var(--text-dim)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-input)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              + CUSTOM...
            </button>
          ) : (
            <div style={{ padding: "6px 10px", display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                ref={customInputRef}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type priority..."
                style={{
                  flex: 1,
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontFamily: "Roboto, sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 300,
                  padding: "4px 6px",
                  outline: "none",
                  minWidth: 0,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
              />
              <button
                onClick={submitCustom}
                disabled={!customValue.trim()}
                className="font-label"
                style={{
                  background: customValue.trim() ? "var(--accent)" : "var(--bg-input)",
                  border: "none",
                  color: customValue.trim() ? "#fff" : "var(--text-dim)",
                  fontSize: "0.45rem",
                  padding: "4px 7px",
                  cursor: customValue.trim() ? "pointer" : "not-allowed",
                  letterSpacing: "0.08em",
                  flexShrink: 0,
                }}
              >
                OK
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
