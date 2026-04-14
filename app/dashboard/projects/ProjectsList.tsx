"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Project, ProjectStep, ProjectLog } from "@/lib/types";
import ProjectCard from "./ProjectCard";
import { SortControls } from "@/app/dashboard/OverviewProjectList";
import {
  ORDER_KEY,
  MODE_KEY,
  SortMode,
  sortByUrgency,
  sortByDate,
  applyOrder,
  loadSavedSort,
} from "@/lib/projectSort";

type ProjectWithRelations = Project & {
  project_steps: ProjectStep[];
  project_logs: ProjectLog[];
};

function SortableProjectCard({
  project,
  expanded,
  dimmed,
  onToggle,
}: {
  project: ProjectWithRelations;
  expanded: boolean;
  dimmed: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const dragHandleStrip = (
    <div
      {...listeners}
      {...attributes}
      onClick={(e) => e.stopPropagation()}
      title="Drag to reorder"
      className="w-10 md:w-[22px]"
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        color: "var(--text-muted)",
        opacity: 0.25,
        fontSize: "0.75rem",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
      }}
    >
      ⠿
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
    >
      <ProjectCard
        project={project}
        expanded={expanded}
        dimmed={dimmed}
        onToggle={onToggle}
        dragHandleStrip={dragHandleStrip}
      />
    </div>
  );
}

export default function ProjectsList({ projects }: { projects: ProjectWithRelations[] }) {
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [sortMode, setSortMode]           = useState<SortMode>("urgency");
  const [ordered, setOrdered]             = useState<ProjectWithRelations[]>(() => sortByUrgency(projects));
  const [activeId, setActiveId]           = useState<string | null>(null);
  const [hasSavedOrder, setHasSavedOrder] = useState(false);

  useEffect(() => {
    const { mode, ordered: restored } = loadSavedSort(projects);
    setSortMode(mode);
    setOrdered(restored as ProjectWithRelations[]);
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
      setOrdered(applyOrder(projects, savedOrder) as ProjectWithRelations[]);
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={ordered.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {ordered.map((project) => (
              <SortableProjectCard
                key={project.id}
                project={project}
                expanded={expandedId === project.id}
                dimmed={expandedId !== null && expandedId !== project.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === project.id ? null : project.id))
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
