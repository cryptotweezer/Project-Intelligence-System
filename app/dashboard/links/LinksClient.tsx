"use client";

import { useState, useTransition } from "react";
import { deleteLink, toggleLinkRead, saveLink } from "@/app/actions/links";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SavedLink {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  source_type: string;
  tags: string[];
  notes: string | null;
  is_read: boolean;
  created_at: string;
}

// ── Source badge config ───────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  youtube:   { label: "YouTube",   color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  twitter:   { label: "X / Twitter", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
  instagram: { label: "Instagram", color: "#e1306c", bg: "rgba(225,48,108,0.1)" },
  facebook:  { label: "Facebook",  color: "#1877f2", bg: "rgba(24,119,242,0.1)" },
  web:       { label: "Web",       color: "#22d3ee", bg: "rgba(34,211,238,0.08)" },
  other:     { label: "Other",     color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

const FILTERS = ["all", "youtube", "twitter", "instagram", "facebook", "web"] as const;
type Filter = typeof FILTERS[number];

// ── Add link form (minimalist, bottom) ───────────────────────────────────────

function AddLinkForm() {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleSave() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      await saveLink(trimmed);
      setUrl("");
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="mt-10 pt-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      <div className="flex gap-2 items-center">
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); setOk(false); }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Paste a link to save..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--border)",
            color: "var(--text-primary)",
            padding: "6px 0",
            fontSize: "16px",
            outline: "none",
          }}
        />
        <button
          onClick={handleSave}
          disabled={!url.trim() || saving}
          className="font-label"
          style={{
            fontSize: "0.55rem",
            letterSpacing: "0.12em",
            padding: "6px 14px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: ok ? "#22d3ee" : "var(--text-muted)",
            cursor: !url.trim() || saving ? "default" : "pointer",
            opacity: !url.trim() || saving ? 0.4 : 1,
            transition: "color 0.2s",
            flexShrink: 0,
          }}
        >
          {saving ? "..." : ok ? "SAVED" : "SAVE"}
        </button>
      </div>
      {error && (
        <div className="font-label text-ruby-red mt-2" style={{ fontSize: "0.58rem", letterSpacing: "0.06em" }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ── Link card ─────────────────────────────────────────────────────────────────

function LinkCard({ link }: { link: SavedLink }) {
  const [pending, startTransition] = useTransition();
  const src = SOURCE_CONFIG[link.source_type] ?? SOURCE_CONFIG.web;

  function handleDelete() {
    if (!confirm("Delete this link?")) return;
    startTransition(() => deleteLink(link.id));
  }

  function handleToggleRead() {
    startTransition(() => toggleLinkRead(link.id, !link.is_read));
  }

  const date = new Date(link.created_at).toLocaleDateString("en-AU", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `2px solid ${src.color}60`,
        opacity: pending ? 0.5 : link.is_read ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {/* Thumbnail */}
      {link.image_url && (
        <a href={link.url} target="_blank" rel="noopener noreferrer">
          <img
            src={link.image_url}
            alt=""
            style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </a>
      )}

      <div className="p-4">
        {/* Source badge + date */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="font-label"
            style={{
              fontSize: "0.5rem",
              letterSpacing: "0.1em",
              color: src.color,
              background: src.bg,
              border: `1px solid ${src.color}40`,
              padding: "2px 7px",
            }}
          >
            {src.label.toUpperCase()}
          </span>
          <span className="font-label text-outline" style={{ fontSize: "0.5rem", letterSpacing: "0.06em" }}>
            {date}
          </span>
        </div>

        {/* Title */}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-label hover:underline"
          style={{
            fontSize: "0.72rem",
            letterSpacing: "0.04em",
            color: "var(--text-primary)",
            display: "block",
            marginBottom: "6px",
            lineHeight: "1.35",
          }}
        >
          {link.title ?? link.url}
        </a>

        {/* Description */}
        {link.description && (
          <p
            className="text-outline"
            style={{ fontSize: "0.72rem", lineHeight: "1.45", marginBottom: "8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {link.description}
          </p>
        )}

        {/* Notes */}
        {link.notes && (
          <p
            style={{
              fontSize: "0.68rem",
              color: "#d1bcff",
              fontStyle: "italic",
              marginBottom: "8px",
              lineHeight: "1.4",
            }}
          >
            {link.notes}
          </p>
        )}

        {/* Tags */}
        {link.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {link.tags.map((t) => (
              <span
                key={t}
                className="font-label"
                style={{
                  fontSize: "0.48rem",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                  background: "var(--bg-base)",
                  border: "1px solid var(--border-subtle)",
                  padding: "2px 7px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleToggleRead}
            className="font-label transition-opacity hover:opacity-80"
            style={{
              fontSize: "0.52rem",
              letterSpacing: "0.1em",
              color: link.is_read ? "var(--text-muted)" : "var(--accent)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {link.is_read ? "◎ VIEWED" : "○ MARK VIEWED"}
          </button>
          <button
            onClick={handleDelete}
            className="font-label transition-opacity hover:opacity-80"
            style={{
              fontSize: "0.52rem",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ✕ DELETE
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────────

export default function LinksClient({ links: initialLinks }: { links: SavedLink[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showRead, setShowRead] = useState(true);

  const filtered = initialLinks.filter((l) => {
    if (filter !== "all" && l.source_type !== filter) return false;
    if (!showRead && l.is_read) return false;
    return true;
  });

  const unreadCount = initialLinks.filter((l) => !l.is_read).length;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => {
            const count = f === "all"
              ? initialLinks.length
              : initialLinks.filter((l) => l.source_type === f).length;
            if (f !== "all" && count === 0) return null;
            const isActive = filter === f;
            const srcCfg = f !== "all" ? SOURCE_CONFIG[f] : null;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="font-label transition-all"
                style={{
                  fontSize: "0.52rem",
                  letterSpacing: "0.1em",
                  padding: "4px 10px",
                  border: `1px solid ${isActive ? (srcCfg?.color ?? "var(--accent)") : "var(--border-subtle)"}`,
                  background: isActive ? (srcCfg?.bg ?? "rgba(34,211,238,0.08)") : "transparent",
                  color: isActive ? (srcCfg?.color ?? "var(--accent)") : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                {f.toUpperCase()} <span style={{ opacity: 0.6 }}>{count}</span>
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Toggle read */}
        <button
          onClick={() => setShowRead((v) => !v)}
          className="font-label"
          style={{
            fontSize: "0.52rem",
            letterSpacing: "0.1em",
            padding: "4px 10px",
            border: `1px solid ${!showRead ? "var(--accent)" : "var(--border-subtle)"}`,
            background: !showRead ? "rgba(34,211,238,0.08)" : "transparent",
            color: !showRead ? "var(--accent)" : "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          {showRead ? "HIDE VIEWED" : "SHOW ALL"}
        </button>
      </div>

      {/* Unread count hint */}
      {unreadCount > 0 && (
        <div
          className="font-label text-outline mb-4"
          style={{ fontSize: "0.55rem", letterSpacing: "0.12em" }}
        >
          {unreadCount} UNREAD
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="p-12 text-center"
          style={{ border: "1px solid var(--border-subtle)" }}
        >
          <span className="font-label text-outline" style={{ fontSize: "0.65rem", letterSpacing: "0.2em" }}>
            {initialLinks.length === 0 ? "NO LINKS SAVED YET" : "NO RESULTS"}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      )}

      {/* Add link — minimalist, at the bottom */}
      <AddLinkForm />
    </div>
  );
}
