"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSkill, deleteSkill } from "@/app/actions/skills";

interface Skill {
  id: string;
  name: string;
  command: string;
  description: string | null;
  content: string;
  is_active: boolean;
}

// ── Read view ─────────────────────────────────────────────────────────────────

function SkillView({ skill, onEdit, onDelete, isDeleting }: { skill: Skill; onEdit: () => void; onDelete: () => void; isDeleting: boolean }) {
  return (
    <div className="space-y-5">
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="font-label"
          style={{
            fontSize: "0.52rem",
            letterSpacing: "0.12em",
            color: skill.is_active ? "#22d3ee" : "var(--text-dim)",
            border: `1px solid ${skill.is_active ? "rgba(34,211,238,0.3)" : "var(--border-subtle)"}`,
            padding: "3px 10px",
          }}
        >
          {skill.command}
        </span>
        <span
          className="font-label"
          style={{
            fontSize: "0.48rem",
            letterSpacing: "0.1em",
            color: skill.is_active ? "rgba(34,211,238,0.7)" : "var(--text-dim)",
          }}
        >
          {skill.is_active ? "ACTIVE" : "INACTIVE"}
        </span>
        <button
          onClick={onEdit}
          className="font-label"
          style={{
            fontSize: "0.52rem",
            letterSpacing: "0.12em",
            color: "var(--accent)",
            border: "1px solid rgba(59,130,246,0.3)",
            background: "rgba(59,130,246,0.04)",
            padding: "5px 16px",
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          EDIT
        </button>
      </div>

      {/* Description */}
      {skill.description && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            padding: "18px 20px",
          }}
        >
          <div className="font-label mb-2" style={{ fontSize: "0.46rem", letterSpacing: "0.18em", color: "var(--text-dim)" }}>
            DESCRIPTION
          </div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
            {skill.description}
          </p>
        </div>
      )}

      {/* Skill content */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderLeft: "3px solid rgba(59,130,246,0.4)",
          padding: "20px 24px",
        }}
      >
        <div className="font-label mb-4" style={{ fontSize: "0.46rem", letterSpacing: "0.18em", color: "var(--text-dim)" }}>
          SKILL INSTRUCTIONS
        </div>
        <pre
          style={{
            fontSize: "0.83rem",
            color: "var(--text-secondary)",
            lineHeight: 1.75,
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
            fontWeight: 300,
          }}
        >
          {skill.content}
        </pre>
      </div>

      {/* How to invoke */}
      <div
        style={{
          background: "rgba(34,211,238,0.03)",
          border: "1px solid rgba(34,211,238,0.12)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span className="font-label" style={{ fontSize: "0.46rem", letterSpacing: "0.12em", color: "var(--text-dim)" }}>
          INVOKE IN DASH:
        </span>
        <code
          style={{
            fontSize: "0.82rem",
            color: "#22d3ee",
            background: "rgba(34,211,238,0.08)",
            padding: "2px 10px",
            border: "1px solid rgba(34,211,238,0.2)",
          }}
        >
          {skill.command} your message here
        </code>
      </div>

      {/* Delete */}
      <div style={{ paddingTop: "4px" }}>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="font-label"
          style={{
            fontSize: "0.5rem",
            letterSpacing: "0.1em",
            color: "rgba(255,178,190,0.6)",
            border: "1px solid rgba(255,178,190,0.2)",
            background: "none",
            padding: "6px 16px",
            cursor: isDeleting ? "not-allowed" : "pointer",
            opacity: isDeleting ? 0.5 : 1,
          }}
        >
          {isDeleting ? "DELETING..." : "DELETE SKILL"}
        </button>
      </div>
    </div>
  );
}

// ── Edit form ─────────────────────────────────────────────────────────────────

function SkillEditFormInner({ skill, onCancel }: { skill: Skill; onCancel: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(skill.name);
  const [command, setCommand] = useState(skill.command);
  const [description, setDescription] = useState(skill.description ?? "");
  const [content, setContent] = useState(skill.content);
  const [isActive, setIsActive] = useState(skill.is_active);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !command.trim() || !content.trim()) {
      setError("Name, command, and content are required.");
      return;
    }
    setError("");
    setSaved(false);
    startSaving(async () => {
      const result = await updateSkill(skill.id, { name, command, description: description || undefined, content, is_active: isActive });
      if (result.error) { setError(result.error); return; }
      setSaved(true);
      setTimeout(() => { setSaved(false); onCancel(); }, 1200);
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete skill "${skill.name}"? This cannot be undone.`)) return;
    startDeleting(async () => {
      await deleteSkill(skill.id);
      router.push("/dashboard/skills");
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="font-label" style={{ fontSize: "0.46rem", letterSpacing: "0.14em", color: "var(--text-dim)", display: "block", marginBottom: "8px" }}>
            SKILL NAME
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="obsidian-input" style={{ fontSize: "16px" }} />
        </div>
        <div>
          <label className="font-label" style={{ fontSize: "0.46rem", letterSpacing: "0.14em", color: "var(--text-dim)", display: "block", marginBottom: "8px" }}>
            COMMAND
          </label>
          <input value={command} onChange={(e) => setCommand(e.target.value)} className="obsidian-input" style={{ fontSize: "16px" }} />
        </div>
      </div>

      <div>
        <label className="font-label" style={{ fontSize: "0.46rem", letterSpacing: "0.14em", color: "var(--text-dim)", display: "block", marginBottom: "8px" }}>
          DESCRIPTION
        </label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="obsidian-input" style={{ fontSize: "16px" }} />
      </div>

      <div>
        <label className="font-label" style={{ fontSize: "0.46rem", letterSpacing: "0.14em", color: "var(--text-dim)", display: "block", marginBottom: "8px" }}>
          SKILL CONTENT
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          className="obsidian-input"
          style={{ fontSize: "16px", padding: "10px 0", resize: "vertical", lineHeight: 1.65 }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className="font-label"
          style={{
            fontSize: "0.5rem",
            letterSpacing: "0.12em",
            color: isActive ? "#22d3ee" : "var(--text-dim)",
            border: `1px solid ${isActive ? "rgba(34,211,238,0.35)" : "var(--border-subtle)"}`,
            background: isActive ? "rgba(34,211,238,0.05)" : "transparent",
            padding: "5px 14px",
            cursor: "pointer",
          }}
        >
          {isActive ? "ACTIVE" : "INACTIVE"}
        </button>
        <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
          {isActive ? "Dash responds to this command" : "Command disabled"}
        </span>
      </div>

      {error && <p style={{ fontSize: "0.78rem", color: "var(--label-problems)" }}>{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isSaving} className="btn-primary" style={{ width: "auto", padding: "9px 28px", fontSize: "0.6rem" }}>
          {isSaving ? "SAVING..." : saved ? "SAVED ✓" : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="font-label"
          style={{ fontSize: "0.52rem", letterSpacing: "0.1em", color: "var(--text-dim)", background: "none", border: "1px solid var(--border-subtle)", padding: "9px 16px", cursor: "pointer" }}
        >
          CANCEL
        </button>
      </div>

      {/* Danger zone */}
      <div style={{ background: "var(--bg-card)", border: "1px solid rgba(255,178,190,0.15)", padding: "18px", marginTop: "16px" }}>
        <div className="font-label mb-3" style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "var(--ruby-red)" }}>
          DANGER ZONE
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="font-label"
          style={{
            fontSize: "0.55rem",
            letterSpacing: "0.1em",
            color: "var(--ruby-red)",
            border: "1px solid rgba(255,178,190,0.3)",
            background: "rgba(255,178,190,0.04)",
            padding: "8px 20px",
            cursor: isDeleting ? "not-allowed" : "pointer",
            opacity: isDeleting ? 0.5 : 1,
          }}
        >
          {isDeleting ? "DELETING..." : "DELETE SKILL"}
        </button>
      </div>
    </form>
  );
}

// ── Combined view/edit ────────────────────────────────────────────────────────

export default function SkillDetail({ skill }: { skill: Skill; isOwner: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete skill "${skill.name}"? This cannot be undone.`)) return;
    startDeleting(async () => {
      await deleteSkill(skill.id);
      router.push("/dashboard/skills");
    });
  }

  return editing
    ? <SkillEditFormInner skill={skill} onCancel={() => setEditing(false)} />
    : <SkillView skill={skill} onEdit={() => setEditing(true)} onDelete={handleDelete} isDeleting={isDeleting} />;
}
