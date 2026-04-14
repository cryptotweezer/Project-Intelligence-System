"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {/* Pill track */}
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          position: "relative",
          width: "36px",
          height: "20px",
          borderRadius: "10px",
          background: isDark ? "rgba(59,130,246,0.2)" : "rgba(29,95,212,0.15)",
          border: "1px solid var(--border-subtle)",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
          transition: "background 0.25s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "2px",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: "var(--accent)",
            left: isDark ? "2px" : "18px",
            transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </button>

      {/* Label outside */}
      <span
        className="font-label"
        style={{
          fontSize: "0.5rem",
          letterSpacing: "0.12em",
          color: "var(--text-muted)",
          userSelect: "none",
        }}
      >
        {isDark ? "DARK" : "LIGHT"}
      </span>
    </div>
  );
}
