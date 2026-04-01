"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "OVERVIEW", icon: "◈" },
  { href: "/dashboard/projects", label: "PROJECTS", icon: "◉" },
  { href: "/dashboard/completed", label: "TASK COMPLETED", icon: "✓" },
  { href: "/dashboard/agent", label: "AGENT MONITOR", icon: "◈" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex h-screen bg-obsidian overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className="flex-shrink-0 flex flex-col"
        style={{
          width: "220px",
          borderRight: "1px solid rgba(65,71,84,0.25)",
          background: "rgba(14,14,14,0.95)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            borderBottom: "1px solid rgba(65,71,84,0.2)",
            padding: "40px 24px 24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <img
            src="/images/logo.png"
            alt="logo"
            style={{ width: "26px", height: "26px", objectFit: "contain", display: "block", flexShrink: 0 }}
          />
          <span
            className="font-display"
            style={{ fontSize: "0.95rem", letterSpacing: "-0.01em" }}
          >
            <span className="text-white">PROJECT </span>
            <span className="text-electric-blue">INTEL</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 group transition-all duration-150"
                style={{
                  background: isActive
                    ? "rgba(59,130,246,0.06)"
                    : "transparent",
                  borderLeft: isActive
                    ? "1px solid rgba(59,130,246,0.5)"
                    : "1px solid transparent",
                  color: isActive
                    ? "rgba(59,130,246,0.9)"
                    : "rgba(139,145,160,0.6)",
                }}
              >
                <span
                  className="text-[10px]"
                  style={{
                    color: isActive
                      ? "rgba(59,130,246,0.8)"
                      : "rgba(139,145,160,0.4)",
                  }}
                >
                  {item.icon}
                </span>
                <span
                  className="font-label"
                  style={{ fontSize: "0.6rem", letterSpacing: "0.12em" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div
          className="px-3 py-6"
          style={{ borderTop: "1px solid rgba(65,71,84,0.2)" }}
        >
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 group transition-all duration-150"
            style={{
              color: "rgba(139,145,160,0.4)",
              borderLeft: "1px solid transparent",
            }}
          >
            <span className="text-[10px]">⊗</span>
            <span
              className="font-label"
              style={{ fontSize: "0.6rem", letterSpacing: "0.12em" }}
            >
              {signingOut ? "TERMINATING..." : "END SESSION"}
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main Canvas ──────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-obsidian">
        {children}
      </main>
    </div>
  );
}
