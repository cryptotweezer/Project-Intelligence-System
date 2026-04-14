"use client";

import { useTransition } from "react";
import { deleteProject } from "@/app/actions/overview";

export default function DeleteProjectButton({
  projectId,
  projectName,
  redirectTo,
}: {
  projectId: string;
  projectName: string;
  redirectTo?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete "${projectName}"? This will also remove all its steps and logs.`)) return;
    startTransition(() => deleteProject(projectId, redirectTo));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="font-label transition-colors duration-150"
      style={{
        fontSize: "0.55rem",
        letterSpacing: "0.1em",
        color: isPending ? "var(--ruby-red)" : "var(--ruby-red)",
        opacity: isPending ? 0.35 : 0.65,
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
