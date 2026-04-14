"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import ChatWidget from "@/app/dashboard/ChatWidget";
import ThemeToggle from "@/app/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard",           label: "OVERVIEW",        icon: "◈" },
  { href: "/dashboard/projects",  label: "PROJECTS",        icon: "◉" },
  { href: "/dashboard/completed", label: "COMPLETED TASKS", icon: "✓" },
  { href: "/dashboard/leads",     label: "LEAD TRACKER",    icon: "◎" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const { theme }  = useTheme();
  const [mounted, setMounted]       = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  // Close sidebar whenever the route changes (mobile nav)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const logoSrc = mounted && theme === "light"
    ? "/images/logo_black.png"
    : "/images/logo_white.png";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* ── Mobile backdrop ─────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          flex flex-col flex-shrink-0
          transition-transform duration-200 ease-in-out
          md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          width: "220px",
          borderRight: "1px solid var(--border)",
          background: "var(--bg-sidebar)",
        }}
      >
        {/* Logo */}
        <div style={{
          borderBottom: "1px solid var(--border-subtle)",
          padding: "40px 24px 24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          minHeight: 0,
        }}>
          <img
            src={logoSrc}
            alt="logo"
            style={{ width: "28px", height: "28px", objectFit: "contain", flexShrink: 0, display: "block" }}
          />
          <span className="font-display" style={{ fontSize: "0.95rem", letterSpacing: "-0.01em", lineHeight: "28px" }}>
            <span style={{ color: "var(--text-primary)" }}>PROJECT </span>
            <span style={{ color: "var(--accent)" }}>INTEL</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 group transition-all duration-150"
                style={{
                  background:  isActive ? "var(--bg-nav-active)"      : "transparent",
                  borderLeft:  isActive ? "1px solid var(--border-nav-active)" : "1px solid transparent",
                  color:       isActive ? "var(--text-nav-active)"     : "var(--text-nav-inactive)",
                }}
              >
                <span
                  className="text-[10px]"
                  style={{ color: isActive ? "var(--accent-dim)" : "var(--text-nav-icon-inactive)" }}
                >
                  {item.icon}
                </span>
                <span className="font-label" style={{ fontSize: "0.6rem", letterSpacing: "0.12em" }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle + Sign out */}
        <div className="px-3 py-6 space-y-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div className="px-3 py-2">
            <ThemeToggle />
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-150"
            style={{ color: "var(--text-nav-icon-inactive)", borderLeft: "1px solid transparent" }}
          >
            <span className="text-[10px]">⊗</span>
            <span className="font-label" style={{ fontSize: "0.6rem", letterSpacing: "0.12em" }}>
              {signingOut ? "TERMINATING..." : "END SESSION"}
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar — hidden on md+ */}
        <div
          className="flex md:hidden items-center gap-3 px-4 flex-shrink-0"
          style={{
            height: "52px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-sidebar)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-primary)",
              fontSize: "1.2rem",
              lineHeight: 1,
              padding: "4px 6px",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            ☰
          </button>
          <img
            src={logoSrc}
            alt="logo"
            style={{ width: "22px", height: "22px", objectFit: "contain", flexShrink: 0 }}
          />
          <span className="font-display" style={{ fontSize: "0.85rem", letterSpacing: "-0.01em" }}>
            <span style={{ color: "var(--text-primary)" }}>PROJECT </span>
            <span style={{ color: "var(--accent)" }}>INTEL</span>
          </span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-base)" }}>
          {children}
        </main>
      </div>

      <ChatWidget />
    </div>
  );
}
