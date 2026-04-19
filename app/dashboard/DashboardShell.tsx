"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import ChatWidget from "@/app/dashboard/ChatWidget";
import ThemeToggle from "@/app/components/ThemeToggle";
import type { AppUser } from "@/lib/auth";

const ALL_NAV_ITEMS = [
  { href: "/dashboard",           label: "OVERVIEW",        icon: "◈" },
  { href: "/dashboard/projects",  label: "PROJECTS",        icon: "◉" },
  { href: "/dashboard/completed", label: "COMPLETED TASKS", icon: "✓" },
  { href: "/dashboard/links",     label: "LINKS",           icon: "⊕" },
  { href: "/dashboard/skills",    label: "SKILLS",          icon: "◎" },
  { href: "/dashboard/leads",     label: "LEAD TRACKER",    icon: "⬡", ownerOnly: true },
];

export default function DashboardShell({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  const pathname   = usePathname();
  const router     = useRouter();
  const { theme }  = useTheme();
  const [mounted, setMounted]           = useState(false);
  const [signingOut, setSigningOut]     = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const navItems = ALL_NAV_ITEMS.filter((item) => !item.ownerOnly || user.isOwner);

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
        data-tour="sidebar-nav"
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
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour={
                  item.href === "/dashboard/links"
                    ? "links-nav"
                    : item.href === "/dashboard/skills"
                    ? "skills-nav"
                    : undefined
                }
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

        {/* Sign out */}
        <div className="px-3 py-6 space-y-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
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

        {/* Top bar — always visible */}
        <div
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{
            height: "52px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-sidebar)",
          }}
        >
          {/* Left side — mobile only: hamburger + logo */}
          <div className="flex md:hidden items-center gap-3">
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

          {/* Desktop spacer */}
          <div className="hidden md:block" />

          {/* Right side — always: theme toggle + avatar dropdown */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Avatar + dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setAvatarMenuOpen((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="avatar"
                    style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid var(--border-subtle)" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      color: "#000d1a",
                      border: "1px solid rgba(59,130,246,0.4)",
                    }}
                  >
                    {user.email[0].toUpperCase()}
                  </div>
                )}
                <span
                  className="hidden md:block font-label truncate"
                  style={{ fontSize: "0.44rem", letterSpacing: "0.06em", color: "var(--text-dim)", maxWidth: "140px" }}
                  title={user.email}
                >
                  {user.email}
                </span>
                <span style={{ fontSize: "0.5rem", color: "var(--text-dim)", opacity: 0.5 }}>▾</span>
              </button>

              {/* Dropdown */}
              {avatarMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 99 }}
                    onClick={() => setAvatarMenuOpen(false)}
                  />
                  <div
                    className="animate-fade-in"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      zIndex: 100,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      minWidth: "160px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    }}
                  >
                    <Link
                      href="/"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 font-label transition-colors duration-150"
                      style={{ fontSize: "0.52rem", letterSpacing: "0.12em", color: "var(--text-secondary)", textDecoration: "none", borderBottom: "1px solid var(--border-faint)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-nav-active)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: "0.65rem" }}>⌂</span> HOME
                    </Link>
                    <button
                      onClick={() => { setAvatarMenuOpen(false); handleSignOut(); }}
                      disabled={signingOut}
                      className="w-full flex items-center gap-2 px-4 py-3 font-label transition-colors duration-150"
                      style={{ fontSize: "0.52rem", letterSpacing: "0.12em", color: "var(--text-secondary)", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-nav-active)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: "0.65rem" }}>⊗</span> {signingOut ? "ENDING..." : "SIGN OUT"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-base)" }}>
          {children}
        </main>
      </div>

      <ChatWidget userId={user.id} isOwner={user.isOwner} />
    </div>
  );
}
