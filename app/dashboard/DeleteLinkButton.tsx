"use client";

import { deleteLink } from "@/app/actions/overview";

export default function DeleteLinkButton({
  linkId,
  projectId,
}: {
  linkId: string;
  projectId: string;
}) {
  return (
    <button
      onClick={() => deleteLink(linkId, projectId)}
      title="Delete link"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "rgba(139,145,160,0.3)",
        fontSize: "11px",
        padding: "2px 4px",
        lineHeight: 1,
        flexShrink: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,178,190,0.7)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(139,145,160,0.3)")}
    >
      ✕
    </button>
  );
}
