"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Project, ProjectStep } from "@/lib/types";
import {
  ORDER_KEY,
  MODE_KEY,
  SortMode,
  sortByUrgency,
  sortByDate,
  applyOrder,
  loadSavedSort,
} from "@/lib/projectSort";

type ProjectWithSteps = Project & { project_steps: ProjectStep[] };

const tinyBadge: React.CSSProperties = {
  fontSize: "0.45rem",
  padding: "0.1rem 0.35rem",
  letterSpacing: "0.08em",
};

function PriorityBadge({ priority }: { priority: string }) {
  const cls =
    priority === "Urgent"
      ? "badge badge-urgent"
      : priority === "Scheduled"
      ? "badge badge-normal"
      : priority === "Someday"
      ? "badge badge-someday"
      : "badge badge-custom";
  return <span className={cls} style={tinyBadge}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`} style={tinyBadge}>{status}</span>;
}

function CardContent({ project }: { project: ProjectWithSteps }) {
  const steps = project.project_steps ?? [];
  const stepsDone    = steps.filter((s) => s.status === "done").length;
  const stepsPending = steps.filter((s) => s.status !== "done").length;
  const pct = project.completion_pct ?? 0;
  const descSnippet = project.description
    ? project.description.split("\n")[0].slice(0, 80) +
      (project.description.split("\n")[0].length > 80 ? "…" : "")
    : null;

  return (
    <div className="px-4 py-3 group">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="font-label text-outline" style={{ fontSize: "0.48rem", letterSpacing: "0.15em" }}>
          {project.category}
        </span>
        <PriorityBadge priority={project.priority} />
        <StatusBadge status={project.status} />
      </div>

      <h2
        className="font-display group-hover:text-electric-blue transition-colors duration-150 mb-1"
        style={{ color: "var(--text-primary)", fontSize: "0.92rem", letterSpacing: "-0.01em" }}
      >
        {project.name}
      </h2>

      <div className="font-label mb-2" style={{ fontSize: "0.45rem", letterSpacing: "0.12em", color: "var(--text-primary)" }}>
        ASSIGNED · {project.agent.toUpperCase()}
      </div>

      {descSnippet && (
        <p className="text-outline font-light mb-2" style={{ fontSize: "0.68rem", lineHeight: "1.4" }}>
          {descSnippet}
        </p>
      )}

      <div
        className="flex items-center gap-3 flex-wrap"
        style={{ borderTop: "1px solid var(--border-faint)", paddingTop: "6px" }}
      >
        <span className="font-label" style={{ fontSize: "0.48rem", letterSpacing: "0.1em", color: "rgba(59,130,246,0.7)" }}>
          PROGRESS {pct}%
        </span>
        <span className="font-label" style={{ fontSize: "0.48rem", letterSpacing: "0.1em", color: "#3b82f6" }}>
          DONE {stepsDone}
        </span>
        <span className="font-label" style={{ fontSize: "0.48rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.9)" }}>
          PENDING {stepsPending}
        </span>
      </div>
    </div>
  );
}

function cardBorderLeft(priority: string) {
  if (priority === "Urgent")    return "2px solid rgba(255,178,190,0.5)";
  if (priority === "Scheduled") return "2px solid rgba(59,130,246,0.3)";
  if (priority === "Someday")   return "2px solid rgba(245,158,11,0.4)";
  return "2px solid rgba(34,211,238,0.35)";
}

function SortableCard({ project }: { project: ProjectWithSteps }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        display: "flex",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderLeft: cardBorderLeft(project.priority),
      }}
    >
      <div
        {...listeners}
        {...attributes}
        title="Drag to reorder"
        className="w-10 md:w-[22px]"
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isDragging ? "grabbing" : "grab",
          color: "var(--text-muted)",
          opacity: 0.25,
          fontSize: "0.75rem",
          userSelect: "none",
          borderRight: "1px solid var(--border-faint)",
          touchAction: "none",
        }}
      >
        ⠿
      </div>
      <Link href={`/dashboard/projects/${project.id}`} style={{ flex: 1, display: "block" }}>
        <CardContent project={project} />
      </Link>
    </div>
  );
}

function OverlayCard({ project }: { project: ProjectWithSteps }) {
  return (
    <div
      style={{
        display: "flex",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderLeft: cardBorderLeft(project.priority),
        opacity: 0.92,
        cursor: "grabbing",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="w-10 md:w-[22px]"
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          opacity: 0.4,
          fontSize: "0.75rem",
          borderRight: "1px solid var(--border-faint)",
        }}
      >
        ⠿
      </div>
      <CardContent project={project} />
    </div>
  );
}

export default function OverviewProjectList({ projects }: { projects: ProjectWithSteps[] }) {
  const [sortMode, setSortMode]           = useState<SortMode>("urgency");
  const [ordered, setOrdered]             = useState<ProjectWithSteps[]>(() => sortByUrgency(projects));
  const [activeId, setActiveId]           = useState<string | null>(null);
  const [hasSavedOrder, setHasSavedOrder] = useState(false);

  useEffect(() => {
    const { mode, ordered: restored } = loadSavedSort(projects);
    setSortMode(mode);
    setOrdered(restored);
    const savedOrder: string[] = JSON.parse(localStorage.getItem(ORDER_KEY) ?? "[]");
    setHasSavedOrder(savedOrder.length > 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function activateMode(mode: SortMode) {
    setSortMode(mode);
    localStorage.setItem(MODE_KEY, mode);
    if (mode === "urgency") {
      setOrdered(sortByUrgency(projects));
    } else if (mode === "date") {
      setOrdered(sortByDate(projects));
    } else if (mode === "manual") {
      const savedOrder: string[] = JSON.parse(localStorage.getItem(ORDER_KEY) ?? "[]");
      setOrdered(applyOrder(projects, savedOrder));
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrdered((prev) => {
      const oldIdx = prev.findIndex((p) => p.id === active.id);
      const newIdx = prev.findIndex((p) => p.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(oldIdx, 1);
      next.splice(newIdx, 0, moved);
      localStorage.setItem(ORDER_KEY, JSON.stringify(next.map((p) => p.id)));
      localStorage.setItem(MODE_KEY, "manual");
      return next;
    });

    setSortMode("manual");
    setHasSavedOrder(true);
  }

  const activeProject = activeId ? ordered.find((p) => p.id === activeId) : null;

  const sortButtons: { mode: SortMode; label: string }[] = [
    { mode: "urgency", label: "BY URGENCY" },
    { mode: "date",    label: "BY DATE" },
    { mode: "manual",  label: "CUSTOM" },
  ];

  return (
    <>
      <SortControls
        sortMode={sortMode}
        hasSavedOrder={hasSavedOrder}
        buttons={sortButtons}
        onActivate={activateMode}
      />

      {ordered.length === 0 ? (
        <div className="p-12 text-center" style={{ border: "1px solid var(--border-subtle)" }}>
          <div className="font-label text-outline" style={{ fontSize: "0.65rem", letterSpacing: "0.2em" }}>
            NO PROJECTS FOUND
          </div>
          <p className="text-outline font-light text-sm mt-2">Initialize your first project to begin.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ordered.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-2">
              {ordered.map((project) => (
                <SortableCard key={project.id} project={project} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeProject ? <OverlayCard project={activeProject} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
}

// ─── Shared sort controls bar (used by both Overview and Projects list) ───────

export function SortControls({
  sortMode,
  hasSavedOrder,
  buttons,
  onActivate,
}: {
  sortMode: SortMode;
  hasSavedOrder: boolean;
  buttons: { mode: SortMode; label: string }[];
  onActivate: (mode: SortMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="font-label text-outline" style={{ fontSize: "0.52rem", letterSpacing: "0.15em" }}>
        SORT
      </span>
      {buttons.map(({ mode, label }) => {
        const isActive   = sortMode === mode;
        const isDisabled = mode === "manual" && !hasSavedOrder && !isActive;
        return (
          <button
            key={mode}
            onClick={() => !isDisabled && onActivate(mode)}
            disabled={isDisabled}
            className="font-label transition-all duration-150"
            style={{
              fontSize: "0.52rem",
              letterSpacing: "0.12em",
              padding: "3px 10px",
              border: isActive
                ? "1px solid var(--border-nav-active)"
                : "1px solid var(--border-subtle)",
              background: isActive ? "var(--bg-nav-active)" : "transparent",
              color: isActive
                ? "var(--text-nav-active)"
                : isDisabled
                ? "var(--text-muted)"
                : "var(--text-nav-inactive)",
              cursor: isDisabled ? "default" : "pointer",
              opacity: isDisabled ? 0.35 : 1,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
