"use client";

import { useState, useEffect, useTransition } from "react";
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
import type { ProjectStep } from "@/lib/types";
import DeleteStepButton from "@/app/dashboard/DeleteStepButton";
import StepStatusSelect from "@/app/dashboard/StepStatusSelect";
import { reorderSteps, updateStepNotes } from "@/app/actions/overview";

const STATUS_COLORS: Record<string, string> = {
  pending: "#8b91a0",
  in_progress: "#d1bcff",
  done: "#3b82f6",
  error: "#ffb2be",
};

function SortableStep({
  step,
  projectId,
}: {
  step: ProjectStep;
  projectId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const [notesValue, setNotesValue] = useState(step.notes ?? "");
  const [isSaving, startSaving] = useTransition();

  // Sync from server when step data changes
  useEffect(() => {
    setNotesValue(step.notes ?? "");
  }, [step.notes]);

  function handleSaveNotes() {
    startSaving(() => updateStepNotes(step.id, notesValue, projectId));
  }

  const isDone = step.status === "done";
  const isError = step.status === "error";
  const isInProgress = step.status === "in_progress";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : isDone ? 0.5 : 1,
  };

  const borderColor = isError
    ? "rgba(255,178,190,0.5)"
    : isInProgress
    ? "rgba(209,188,255,0.25)"
    : isDone
    ? "rgba(59,130,246,0.2)"
    : "var(--border-faint)";

  const borderLeftColor = isError
    ? "rgba(255,178,190,0.8)"
    : isInProgress
    ? "rgba(209,188,255,0.55)"
    : isDone
    ? "rgba(59,130,246,0.4)"
    : "var(--border-subtle)";

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: "var(--bg-input)",
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${borderLeftColor}`,
        transition: "opacity 0.2s ease",
      }}
    >
      <div className="flex items-start gap-2 py-3 px-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            color: "var(--text-dim)",
            fontSize: "0.85rem",
            lineHeight: 1,
            padding: "3px 2px",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            userSelect: "none",
            touchAction: "none",
            marginTop: "1px",
            opacity: 0.45,
          }}
        >
          ⠿
        </div>

        {/* Dot + number */}
        <div className="flex items-center gap-2 mt-0.5 flex-shrink-0">
          <span
            style={{
              display: "inline-block",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: STATUS_COLORS[step.status] ?? "#8b91a0",
              flexShrink: 0,
            }}
          />
          <span className="font-display" style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            {step.step_number}
          </span>
        </div>

        {/* Content + mobile controls */}
        <div className="flex-1 min-w-0">
          <div
            className="font-light text-sm"
            style={{ color: isDone ? "var(--text-dim)" : "var(--text-primary)" }}
          >
            {step.title}
          </div>
          {step.description && (
            <div className="text-outline font-light text-xs mt-0.5">{step.description}</div>
          )}
          {/* Non-error notes as read-only */}
          {step.notes && !isError && (
            <div className="mt-1 text-xs font-light" style={{ color: "var(--label-purple)" }}>
              {step.notes}
            </div>
          )}
          {/* Controls below text on mobile */}
          <div className="flex items-center gap-2 mt-2 sm:hidden">
            <StepStatusSelect stepId={step.id} projectId={projectId} currentStatus={step.status} />
            <DeleteStepButton stepId={step.id} projectId={projectId} />
          </div>
        </div>

        {/* Status + delete — desktop only */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <StepStatusSelect stepId={step.id} projectId={projectId} currentStatus={step.status} />
          <DeleteStepButton stepId={step.id} projectId={projectId} />
        </div>
      </div>

      {/* Error notes — inline editable */}
      {isError && (
        <div
          style={{
            borderTop: "1px solid rgba(255,178,190,0.2)",
            padding: "10px 14px 12px",
            background: "rgba(255,178,190,0.04)",
          }}
        >
          <div
            className="font-label mb-2"
            style={{ fontSize: "0.44rem", letterSpacing: "0.14em", color: "#ffb2be" }}
          >
            ERROR NOTES
          </div>
          <textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            placeholder="Describe the error: what happened, what was tried, what to investigate next..."
            rows={2}
            className="obsidian-input"
            style={{
              width: "100%",
              fontSize: "16px",
              padding: "6px 10px",
              resize: "vertical",
              color: "var(--label-problems)",
              borderColor: "rgba(255,178,190,0.25)",
            }}
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleSaveNotes}
              disabled={isSaving}
              className="font-label"
              style={{
                fontSize: "0.44rem",
                letterSpacing: "0.1em",
                color: isSaving ? "var(--text-dim)" : "var(--label-problems)",
                background: "none",
                border: "1px solid var(--label-problems)",
                opacity: isSaving ? 0.4 : 0.75,
                padding: "3px 10px",
                cursor: isSaving ? "not-allowed" : "pointer",
                borderRadius: "3px",
              }}
            >
              {isSaving ? "SAVING..." : "SAVE NOTES"}
            </button>
            {!isSaving && notesValue === (step.notes ?? "") && notesValue !== "" && (
              <span className="font-label" style={{ fontSize: "0.4rem", letterSpacing: "0.08em", color: "var(--text-dim)" }}>
                SAVED
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StepsList({
  steps: initialSteps,
  projectId,
}: {
  steps: ProjectStep[];
  projectId: string;
}) {
  const [steps, setSteps] = useState(initialSteps);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setSteps(initialSteps);
  }, [initialSteps]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(steps, oldIndex, newIndex).map((s, i) => ({
      ...s,
      step_number: i + 1,
    }));

    setSteps(newOrder);
    startTransition(() =>
      reorderSteps(
        projectId,
        newOrder.map((s) => s.id)
      )
    );
  }

  if (steps.length === 0) {
    return <p className="text-outline font-light text-sm">No steps defined yet.</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {steps.map((step) => (
            <SortableStep key={step.id} step={step} projectId={projectId} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
