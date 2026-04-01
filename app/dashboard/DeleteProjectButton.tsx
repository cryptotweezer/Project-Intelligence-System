"use client";

import { useTransition } from "react";
import { deleteProject } from "@/app/actions/overview";

export default function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete project "${projectName}"? This will also remove all its steps and logs.`)) return;
    startTransition(() => deleteProject(projectId));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="font-label transition-colors duration-150"
      style={{
        fontSize: "0.55rem",
        letterSpacing: "0.1em",
        color: isPending ? "rgba(255,178,190,0.3)" : "rgba(255,178,190,0.5)",
        cursor: isPending ? "not-allowed" : "pointer",
        background: "none",
        border: "none",
        padding: 0,
      }}
    >
      {isPending ? "DELETING..." : "⊗ DELETE"}
    </button>
  );
}
