"use client";

import { useTransition } from "react";
import { markProjectDone } from "@/app/actions/overview";

export default function MarkCompleteButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Mark this project as completed? It will be moved to Completed Tasks.")) return;
    startTransition(() => markProjectDone(projectId));
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="font-label"
      style={{
        fontSize: "0.6rem",
        letterSpacing: "0.12em",
        color: isPending ? "rgba(59,130,246,0.4)" : "#000d1a",
        background: isPending ? "rgba(59,130,246,0.15)" : "#3b82f6",
        border: "none",
        padding: "8px 20px",
        cursor: isPending ? "not-allowed" : "pointer",
        transition: "background 0.15s ease, box-shadow 0.15s ease",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        if (!isPending) e.currentTarget.style.boxShadow = "0 0 16px rgba(59,130,246,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {isPending ? "COMPLETING..." : "✓ MARK AS COMPLETED"}
    </button>
  );
}
