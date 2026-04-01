"use client";

import { useTransition } from "react";
import { deleteStep } from "@/app/actions/overview";

export default function DeleteStepButton({ stepId, projectId }: { stepId: string; projectId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Delete this step?")) return;
    startTransition(() => deleteStep(stepId, projectId));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Delete step"
      style={{
        fontSize: "0.65rem",
        color: isPending ? "rgba(255,178,190,0.2)" : "rgba(255,178,190,0.3)",
        background: "none",
        border: "none",
        cursor: isPending ? "not-allowed" : "pointer",
        padding: "0 4px",
        lineHeight: 1,
        transition: "color 0.15s",
        flexShrink: 0,
      }}
    >
      ✕
    </button>
  );
}
