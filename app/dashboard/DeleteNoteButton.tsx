"use client";

import { useTransition } from "react";
import { deleteNote } from "@/app/actions/overview";

export default function DeleteNoteButton({ noteId, projectSlug }: { noteId: string; projectSlug: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => { if (!confirm("Delete this note?")) return; startTransition(() => deleteNote(noteId, projectSlug)); }}
      disabled={pending}
      className="font-label transition-opacity hover:opacity-80"
      style={{
        fontSize: "0.48rem",
        letterSpacing: "0.1em",
        color: "var(--text-dim)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        opacity: pending ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      ✕
    </button>
  );
}
