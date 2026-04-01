"use client";

import { useTransition } from "react";
import { deleteLog } from "@/app/actions/overview";

export default function DeleteLogButton({ logId, projectId }: { logId: string; projectId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Delete this log entry?")) return;
    startTransition(() => deleteLog(logId, projectId));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Delete log"
      style={{
        fontSize: "0.7rem",
        color: isPending ? "rgba(255,178,190,0.2)" : "rgba(255,178,190,0.35)",
        background: "none",
        border: "none",
        cursor: isPending ? "not-allowed" : "pointer",
        padding: "0 4px",
        lineHeight: 1,
        transition: "color 0.15s",
      }}
    >
      ✕
    </button>
  );
}
