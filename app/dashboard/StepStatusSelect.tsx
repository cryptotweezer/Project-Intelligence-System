"use client";

import { useTransition } from "react";
import { updateStepStatus } from "@/app/actions/overview";

const STATUS_OPTIONS = [
  { value: "pending", label: "PENDING", color: "#8b91a0" },
  { value: "in_progress", label: "IN PROGRESS", color: "#d1bcff" },
  { value: "done", label: "DONE", color: "#3b82f6" },
  { value: "error", label: "ERROR", color: "#ffb2be" },
];

export default function StepStatusSelect({
  stepId,
  projectId,
  currentStatus,
}: {
  stepId: string;
  projectId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const current = STATUS_OPTIONS.find((o) => o.value === currentStatus);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    startTransition(() => updateStepStatus(stepId, newStatus, projectId));
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className="font-label"
      style={{
        fontSize: "0.5rem",
        letterSpacing: "0.1em",
        color: current?.color ?? "#8b91a0",
        background: "rgba(14,14,14,0.9)",
        border: "1px solid rgba(65,71,84,0.3)",
        padding: "2px 6px",
        cursor: isPending ? "not-allowed" : "pointer",
        outline: "none",
        opacity: isPending ? 0.5 : 1,
      }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
