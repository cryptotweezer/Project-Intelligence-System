"use client";

import { useTransition } from "react";
import { moveStep } from "@/app/actions/overview";

export default function MoveStepButtons({
  stepId,
  projectId,
  isFirst,
  isLast,
}: {
  stepId: string;
  projectId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(() => moveStep(stepId, projectId, direction));
  }

  return (
    <div className="flex flex-col gap-0.5" style={{ opacity: isPending ? 0.3 : 1 }}>
      <button
        onClick={() => move("up")}
        disabled={isFirst || isPending}
        title="Move up"
        style={{
          fontSize: "0.55rem",
          color: isFirst ? "rgba(65,71,84,0.3)" : "rgba(139,145,160,0.5)",
          background: "none",
          border: "none",
          cursor: isFirst ? "default" : "pointer",
          padding: "0 2px",
          lineHeight: 1,
        }}
      >
        ▲
      </button>
      <button
        onClick={() => move("down")}
        disabled={isLast || isPending}
        title="Move down"
        style={{
          fontSize: "0.55rem",
          color: isLast ? "rgba(65,71,84,0.3)" : "rgba(139,145,160,0.5)",
          background: "none",
          border: "none",
          cursor: isLast ? "default" : "pointer",
          padding: "0 2px",
          lineHeight: 1,
        }}
      >
        ▼
      </button>
    </div>
  );
}
