"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteSkill, createSkill } from "@/app/actions/skills";

const ORDER_KEY = "pis-skills-order";

interface Skill {
  id: string;
  name: string;
  command: string;
  description: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
}

// ── Sortable card ─────────────────────────────────────────────────────────────

function SortableSkillCard({
  skill,
  isExpanded,
  onToggle,
}: {
  skill: Skill;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skill.id });

  const [isPending, startTransition] = useTransition();

  const slug = skill.command.replace("/", "");

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Delete skill "${skill.name}"? This cannot be undone.`)) return;
    startTransition(async () => { await deleteSkill(skill.id); });
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : isPending ? 0.5 : 1,
        background: "var(--bg-card)",
        border: `1px solid ${skill.is_active ? "rgba(59,130,246,0.2)" : "var(--border-subtle)"}`,
        borderLeft: `3px solid ${skill.is_active ? "rgba(59,130,246,0.5)" : "var(--border)"}`,
        marginBottom: "8px",
      }}
    >
      {/* Card header — click to expand */}
      <div
        onClick={onToggle}
        className="flex items-center gap-3"
        style={{ padding: "12px 14px", cursor: "pointer", userSelect: "none" }}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            color: "var(--text-dim)",
            fontSize: "0.85rem",
            flexShrink: 0,
            touchAction: "none",
            opacity: 0.5,
            padding: "2px 4px",
          }}
        >
          ⠿
        </div>

        {/* Command badge */}
        <span
          className="font-label flex-shrink-0"
          style={{
            fontSize: "0.48rem",
            letterSpacing: "0.12em",
            color: skill.is_active ? "#22d3ee" : "var(--text-dim)",
            border: `1px solid ${skill.is_active ? "rgba(34,211,238,0.3)" : "var(--border-subtle)"}`,
            padding: "2px 8px",
          }}
        >
          {skill.command}
        </span>

        {/* Name */}
        <span
          className="font-label flex-1 truncate"
          style={{ fontSize: "0.6rem", letterSpacing: "0.06em", color: "var(--text-primary)" }}
        >
          {skill.name}
        </span>

        {/* Inactive badge */}
        {!skill.is_active && (
          <span
            className="font-label hidden sm:inline flex-shrink-0"
            style={{ fontSize: "0.44rem", letterSpacing: "0.1em", color: "var(--text-dim)" }}
          >
            OFF
          </span>
        )}

        {/* Expand chevron */}
        <span style={{ fontSize: "0.5rem", color: "var(--text-dim)", flexShrink: 0 }}>
          {isExpanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            padding: "14px 14px 14px 44px",
            background: "var(--bg-input)",
          }}
        >
          {skill.description && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "10px", lineHeight: 1.55 }}>
              {skill.description}
            </p>
          )}

          <pre
            style={{
              fontSize: "0.72rem",
              color: "var(--text-dim)",
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              maxHeight: "72px",
              overflow: "hidden",
              maskImage: "linear-gradient(to bottom, black 40%, transparent)",
              marginBottom: "14px",
            }}
          >
            {skill.content}
          </pre>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/skills/${slug}`}
              className="font-label"
              style={{
                fontSize: "0.52rem",
                letterSpacing: "0.12em",
                color: "var(--accent)",
                border: "1px solid rgba(59,130,246,0.3)",
                background: "rgba(59,130,246,0.04)",
                padding: "5px 14px",
                textDecoration: "none",
                display: "inline-block",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              OPEN SKILL &#8599;
            </Link>

            <button
              onClick={handleDelete}
              disabled={isPending}
              className="font-label"
              style={{
                fontSize: "0.52rem",
                letterSpacing: "0.1em",
                color: "rgba(255,178,190,0.6)",
                border: "1px solid rgba(255,178,190,0.2)",
                background: "none",
                padding: "5px 14px",
                cursor: isPending ? "not-allowed" : "pointer",
              }}
            >
              DELETE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline create form ────────────────────────────────────────────────────────

function CreateSkillForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("/");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !command.trim() || !content.trim()) {
      setError("Name, command, and content are required.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await createSkill(name, command, content, description || undefined);
      if (result.error) { setError(result.error); return; }
      onClose();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "var(--bg-card)",
        border: "1px solid rgba(59,130,246,0.2)",
        borderLeft: "3px solid rgba(59,130,246,0.6)",
        padding: "18px",
        marginBottom: "12px",
      }}
    >
      <div className="font-label mb-4" style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "var(--accent)" }}>
        NEW SKILL
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="font-label" style={{ fontSize: "0.44rem", letterSpacing: "0.1em", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>
            NAME
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Software Dev Expert"
            className="obsidian-input"
            style={{ fontSize: "16px" }}
          />
        </div>
        <div>
          <label className="font-label" style={{ fontSize: "0.44rem", letterSpacing: "0.1em", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>
            COMMAND
          </label>
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="/dev"
            className="obsidian-input"
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="font-label" style={{ fontSize: "0.44rem", letterSpacing: "0.1em", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>
          DESCRIPTION (optional)
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of what this skill does"
          className="obsidian-input"
          style={{ fontSize: "16px" }}
        />
      </div>

      <div className="mb-4">
        <label className="font-label" style={{ fontSize: "0.44rem", letterSpacing: "0.1em", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>
          CONTENT
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Instructions Dash follows when this skill is invoked..."
          rows={5}
          className="obsidian-input"
          style={{ fontSize: "16px", padding: "8px 0", resize: "vertical", lineHeight: 1.6 }}
        />
      </div>

      {error && (
        <p style={{ fontSize: "0.75rem", color: "var(--label-problems)", marginBottom: "12px" }}>{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
          style={{ width: "auto", padding: "8px 24px", fontSize: "0.58rem" }}
        >
          {isPending ? "CREATING..." : "CREATE SKILL"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="font-label"
          style={{
            fontSize: "0.52rem",
            letterSpacing: "0.1em",
            color: "var(--text-dim)",
            background: "none",
            border: "1px solid var(--border-subtle)",
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SkillsClient({
  skills: initialSkills,
  isOwner,
  guestLimit,
  skillCount,
}: {
  skills: Skill[];
  isOwner: boolean;
  guestLimit: number;
  skillCount: number;
}) {
  const [skills, setSkills] = useState(initialSkills);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const atGuestLimit = !isOwner && skillCount >= guestLimit;

  // Apply localStorage order on mount
  useEffect(() => {
    const stored = localStorage.getItem(ORDER_KEY);
    if (!stored) return;
    try {
      const order = JSON.parse(stored) as string[];
      const sorted = [...initialSkills].sort((a, b) => {
        const ai = order.indexOf(a.id);
        const bi = order.indexOf(b.id);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
      setSkills(sorted);
    } catch { /* ignore */ }
  }, [initialSkills]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = skills.findIndex((s) => s.id === active.id);
    const newIdx = skills.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(skills, oldIdx, newIdx);
    setSkills(newOrder);
    localStorage.setItem(ORDER_KEY, JSON.stringify(newOrder.map((s) => s.id)));
  }

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      {/* Guest limit bar */}
      {!isOwner && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 mb-5"
          style={{
            background: "rgba(59,130,246,0.04)",
            border: "1px solid rgba(59,130,246,0.15)",
            borderLeft: "3px solid rgba(59,130,246,0.4)",
            padding: "10px 14px",
          }}
        >
          <span className="font-label" style={{ fontSize: "0.5rem", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
            GUEST SKILLS: {skillCount} / {guestLimit}
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            {Array.from({ length: guestLimit }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: "24px",
                  height: "4px",
                  background: i < skillCount ? "var(--accent)" : "var(--border)",
                  borderRadius: "2px",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {skills.length === 0
            ? "No skills yet. Create your first one."
            : `${skills.length} skill${skills.length === 1 ? "" : "s"}`}
        </p>

        {!showForm && !atGuestLimit && (
          <button
            onClick={() => setShowForm(true)}
            className="font-label"
            style={{
              fontSize: "0.55rem",
              letterSpacing: "0.12em",
              color: "var(--accent)",
              border: "1px solid rgba(59,130,246,0.3)",
              background: "rgba(59,130,246,0.04)",
              padding: "7px 16px",
              cursor: "pointer",
            }}
          >
            + NEW SKILL
          </button>
        )}
        {!showForm && atGuestLimit && (
          <span className="font-label" style={{ fontSize: "0.5rem", letterSpacing: "0.1em", color: "var(--text-dim)" }}>
            LIMIT REACHED — {guestLimit}/{guestLimit}
          </span>
        )}
      </div>

      {/* Create form */}
      {showForm && <CreateSkillForm onClose={() => setShowForm(false)} />}

      {/* DnD skill list */}
      {skills.length === 0 && !showForm ? (
        <p className="text-outline font-light text-sm">No skills defined yet.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={skills.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {skills.map((skill) => (
              <SortableSkillCard
                key={skill.id}
                skill={skill}
                isExpanded={expandedId === skill.id}
                onToggle={() => toggleExpanded(skill.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
