"use client";

import { useTransition } from "react";
import { deleteLead, deleteResumeUser } from "@/app/actions/leads";

const btnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
  fontSize: "0.7rem",
  lineHeight: 1,
  padding: "2px 4px",
  flexShrink: 0 as const,
  opacity: 0.5,
  transition: "opacity 0.15s",
};

export function DeleteLeadButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => deleteLead(id))}
      style={{ ...btnStyle, opacity: pending ? 0.2 : 0.5 }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = pending ? "0.2" : "0.5")}
      title="Delete lead"
    >
      ✕
    </button>
  );
}

export function DeleteUserButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => deleteResumeUser(id))}
      style={{ ...btnStyle, opacity: pending ? 0.2 : 0.5 }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = pending ? "0.2" : "0.5")}
      title="Delete user"
    >
      ✕
    </button>
  );
}
