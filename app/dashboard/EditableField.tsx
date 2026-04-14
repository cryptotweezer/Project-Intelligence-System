"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { updateProjectField } from "@/app/actions/overview";

type Props = {
  projectId: string;
  field: "description" | "expected_result";
  value: string | null;
  placeholder: string;
};

export default function EditableField({ projectId, field, value, placeholder }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(draft.length, draft.length);
    }
  }, [editing]);

  function handleSave() {
    startTransition(async () => {
      await updateProjectField(projectId, field, draft);
      setEditing(false);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setDraft(value ?? "");
      setEditing(false);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSave();
    }
  }

  return (
    <div>
      {/* View mode */}
      {!editing && (
        <div>
          {value ? (
            <p className="font-light text-sm leading-relaxed mb-3" style={{ whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>
              {value}
            </p>
          ) : (
            <p className="font-light text-sm mb-3" style={{ color: "var(--text-dim)", fontStyle: "italic" }}>
              {placeholder}
            </p>
          )}
          <button
            onClick={() => setEditing(true)}
            className="font-label"
            style={{
              fontSize: "0.5rem",
              letterSpacing: "0.12em",
              color: "rgba(59,130,246,0.5)",
              background: "none",
              border: "1px solid rgba(59,130,246,0.15)",
              padding: "3px 10px",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(59,130,246,0.9)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(59,130,246,0.5)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.15)";
            }}
          >
            EDIT
          </button>
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={6}
            className="obsidian-input w-full"
            style={{ fontSize: "0.8rem", lineHeight: "1.6", padding: "8px 10px", resize: "vertical" }}
            placeholder={placeholder}
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="font-label"
              style={{
                fontSize: "0.5rem",
                letterSpacing: "0.1em",
                color: isPending ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.9)",
                background: "none",
                border: "1px solid rgba(59,130,246,0.3)",
                padding: "3px 10px",
                cursor: isPending ? "not-allowed" : "pointer",
              }}
            >
              {isPending ? "SAVING..." : "SAVE"}
            </button>
            <button
              onClick={() => { setDraft(value ?? ""); setEditing(false); }}
              className="font-label text-outline"
              style={{ fontSize: "0.5rem", letterSpacing: "0.1em", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              CANCEL
            </button>
            <span className="font-label text-outline" style={{ fontSize: "0.42rem", letterSpacing: "0.05em" }}>
              Ctrl+Enter · Esc
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
