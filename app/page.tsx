"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/app/components/ThemeToggle";

// ── Typing effect for AI tool names (small, below hero) ──────────────────────

const AI_TOOLS = ["Claude Desktop", "Claude CLI", "Gemini CLI", "Codex", "Windsurf", "Cursor", "Dash"];
const TYPE_SPEED = 65;
const DELETE_SPEED = 35;
const PAUSE_MS = 2400;

function useTypingEffect() {
  const [displayed, setDisplayed] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = AI_TOOLS[wordIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && charIdx < word.length) {
      timeout = setTimeout(() => setCharIdx((c) => c + 1), TYPE_SPEED);
    } else if (!deleting && charIdx === word.length) {
      timeout = setTimeout(() => setDeleting(true), PAUSE_MS);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx((c) => c - 1), DELETE_SPEED);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % AI_TOOLS.length);
    }
    setDisplayed(word.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx]);

  return displayed;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "◈",
    color: "#3b82f6",
    title: "Always-On Context",
    desc: "Every project lives in a shared database. Switch AI tools mid-task and nothing is lost. The next AI picks up with full knowledge of what was done, what is next, and why.",
  },
  {
    icon: "◎",
    color: "#22d3ee",
    title: "Session Logs Per AI",
    desc: "Every time an AI works on a project it logs what it did, what problems it hit, and what it solved. That log becomes permanent context for every AI that comes after.",
  },
  {
    icon: "⬡",
    color: "#d1bcff",
    title: "One Project. Any Tool.",
    desc: "Start in Dash. Continue in Claude Code. Switch to Cursor. Each tool connects to the same Supabase database via MCP and instantly understands the full project state.",
  },
  {
    icon: "◉",
    color: "#3b82f6",
    title: "Bootstrap in Seconds",
    desc: "Describe any idea in plain language. The built-in agent plans every step, sets priorities, and creates a fully structured project record ready for any AI to work on.",
  },
  {
    icon: "⊕",
    color: "#22d3ee",
    title: "Save and Revisit Later",
    desc: "Find an interesting tutorial, video, or article while browsing? Save the link. Come back later and ask any AI to explain it, break it down, or turn it into a project.",
  },
  {
    icon: "✦",
    color: "#d1bcff",
    title: "Structured Project Records",
    desc: "Steps, expected results, priorities, and agent history. Every project is fully documented and queryable so any AI that connects knows exactly where things stand.",
  },
  {
    icon: "◐",
    color: "#f59e0b",
    title: "Real-Time Progress Tracking",
    desc: "Every project shows a live completion percentage that updates automatically as steps are marked done. At a glance you know exactly how far along each project is. No manual tracking needed.",
  },
  {
    icon: "◧",
    color: "#ffb2be",
    title: "Priority and Status System",
    desc: "Mark projects as Urgent, Scheduled, or Someday. Set custom priorities with a single click. Move projects from active to paused to done to archived as they progress through their lifecycle.",
  },
  {
    icon: "◫",
    color: "#3b82f6",
    title: "Full Project Lifecycle",
    desc: "Every project moves through a defined lifecycle from idea to completion. Steps must all be done before a project can be marked complete. Nothing slips through without being tracked.",
  },
];

const TECH = ["Next.js 14", "Supabase", "OpenAI gpt-4o", "Supabase MCP", "next-themes", "Tailwind CSS"];

const OTHER_PROJECTS = [
  {
    label: "PORTFOLIO",
    name: "Production-Grade CV",
    tagline: "Beyond the static portfolio",
    desc: "A full-stack application with a custom admin dashboard, role-based access control via Clerk, PostgreSQL triggers, an OpenAI-powered contact assistant, and Arcjet WAF protection. Built like a real product, not a static page.",
    tech: ["Next.js 16", "React 19", "Drizzle ORM", "Clerk", "OpenAI", "Arcjet"],
    url: "https://cv.andreshenao.com.au/",
    accent: "#3b82f6",
    accentBg: "rgba(59,130,246,0.04)",
    accentBorder: "rgba(59,130,246,0.2)",
  },
  {
    label: "CYBERSECURITY",
    name: "The Watchtower",
    tagline: "Active defense node",
    desc: "An experimental honeypot that turns defense into a game. The Sentinel AI responds to attack attempts with evolving behavior. Heuristic sensors, a real-time War Room visualization, and a Wall of Infamy for persistent researchers.",
    tech: ["Next.js 15", "NeonDB", "Drizzle ORM", "Arcjet", "AI Behavioral Analysis"],
    url: "https://sentinel.andreshenao.com.au/",
    accent: "#ffb2be",
    accentBg: "rgba(255,178,190,0.04)",
    accentBorder: "rgba(255,178,190,0.2)",
  },
];

// ── Background elements ───────────────────────────────────────────────────────

function GridBg() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        opacity: 0.022,
        zIndex: 0,
      }}
    />
  );
}

function GlowBg() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.07) 0%, transparent 60%)",
        zIndex: 0,
      }}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [navUser, setNavUser] = useState<{ email: string; avatarUrl?: string } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const typedTool = useTypingEffect();

  useEffect(() => {
    setMounted(true);
    // Check if a user is already logged in
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setNavUser({
          email: user.email ?? "",
          avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
        });
      }
    });
  }, []);

  async function handleGuestLogin() {
    setSigningIn(true);
    const supabase = createClient();
    // Use hostname-aware redirect so it works on both localhost and production
    const host = window.location.host.includes("0.0.0.0")
      ? `http://localhost:${window.location.port}`
      : window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${host}/auth/callback` },
    });
  }

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      <GridBg />
      <GlowBg />

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10"
        style={{
          height: "56px",
          background: "var(--bg-base)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center" style={{ gap: "10px" }}>
          {mounted && (
            <img
              src={resolvedTheme === "light" ? "/images/logo_black.png" : "/images/logo_white.png"}
              alt="logo"
              style={{ width: "28px", height: "28px", objectFit: "contain", flexShrink: 0 }}
            />
          )}
          <span className="font-display" style={{ fontSize: "0.9rem", letterSpacing: "-0.01em" }}>
            <span style={{ color: "var(--text-primary)" }}>PROJECT </span>
            <span style={{ color: "var(--accent)" }}>INTEL</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {navUser ? (
            /* Logged-in user avatar + dropdown */
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", cursor: "pointer", padding: "2px" }}
              >
                {navUser.avatarUrl ? (
                  <img src={navUser.avatarUrl} alt="avatar" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-subtle)" }} />
                ) : (
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 600, color: "#000d1a" }}>
                    {navUser.email[0].toUpperCase()}
                  </div>
                )}
                <span
                  className="hidden sm:block font-label truncate"
                  style={{ fontSize: "0.44rem", letterSpacing: "0.06em", color: "var(--text-dim)", maxWidth: "140px" }}
                  title={navUser.email}
                >
                  {navUser.email}
                </span>
                <span style={{ fontSize: "0.5rem", color: "var(--text-dim)", opacity: 0.5 }}>▾</span>
              </button>

              {userMenuOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setUserMenuOpen(false)} />
                  <div
                    className="animate-fade-in"
                    style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", minWidth: "160px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
                  >
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 font-label"
                      style={{ fontSize: "0.52rem", letterSpacing: "0.12em", color: "var(--text-secondary)", textDecoration: "none", display: "flex", borderBottom: "1px solid var(--border-faint)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: "0.65rem" }}>◈</span> DASHBOARD
                    </Link>
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        setNavUser(null);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 font-label"
                      style={{ fontSize: "0.52rem", letterSpacing: "0.12em", color: "var(--text-secondary)", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: "0.65rem" }}>⊗</span> SIGN OUT
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section
        className="relative z-10 flex flex-col items-center justify-start md:justify-center text-center px-6 min-h-0 md:min-h-screen"
        style={{ paddingTop: "calc(56px + 3rem)", paddingBottom: "3rem" }}
      >
        <div className="animate-fade-in" style={{ maxWidth: "800px" }}>

          <div
            className="font-label"
            style={{ fontSize: "0.58rem", letterSpacing: "0.3em", color: "var(--accent)", marginBottom: "6px" }}
          >
            AI-NATIVE PROJECT MANAGEMENT
          </div>
          <div
            style={{
              width: "40px",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)",
              margin: "0 auto 20px",
            }}
          />

          <h1
            className="font-display mb-6"
            style={{
              fontSize: "clamp(2.2rem, 5.5vw, 4.2rem)",
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: "var(--text-primary)",
            }}
          >
            Stop losing context.<br />
            Start getting things done.
          </h1>

          <p
            style={{
              fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)",
              lineHeight: 1.75,
              color: "var(--text-muted)",
              maxWidth: "580px",
              margin: "0 auto 1.5rem",
            }}
          >
            Project Intelligence System keeps every project structured, logged, and fully readable by any AI tool.
            Switch between tools without losing a single step. Every AI that touches a project leaves context for the next one.
          </p>

          {/* Typing effect — small, tool names */}
          <div
            className="font-label hp-works-with mb-8"
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
            }}
          >
            WORKS WITH{" "}
            <span style={{ color: "var(--accent)" }}>
              {typedTool}
              <span style={{ animation: "blink 1s step-end infinite" }}>▌</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleGuestLogin}
              disabled={signingIn}
              className="font-label hp-btn-outline"
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                padding: "12px 28px",
                background: "transparent",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                cursor: signingIn ? "wait" : "pointer",
                opacity: signingIn ? 0.7 : 1,
                borderRadius: "4px",
              }}
            >
              {signingIn ? "REDIRECTING..." : "TRY AS GUEST"}
            </button>
            <Link
              href="/login"
              className="font-label"
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.12em",
                padding: "12px 20px",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                textDecoration: "none",
                display: "inline-block",
                borderRadius: "4px",
              }}
            >
              ACCESS CODE
            </Link>
          </div>
        </div>

      </section>

      {/* ── KEY CONCEPT BANNER ──────────────────────────────────────── */}
      <section
        className="relative z-10 px-6 md:px-10 py-10 md:py-16"
        style={{
          background: "var(--bg-base)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-8 text-center"
          style={{ maxWidth: "960px", margin: "0 auto" }}
        >
          {[
            {
              value: "Zero context lost",
              label: "Switch AI tools at any point. The next tool knows exactly what was done, what is pending, and what the goal is.",
              color: "#3b82f6",
            },
            {
              value: "Every session logged",
              label: "Each AI that works on a project records what it did. That record becomes permanent context for every AI that comes after.",
              color: "#22d3ee",
            },
            {
              value: "Any AI. Same project.",
              label: "Dash. Claude. Cursor. Gemini. Connect any tool via Supabase MCP and it understands your project immediately.",
              color: "#d1bcff",
            },
          ].map((stat, i) => (
            <div key={stat.value} className="px-4 py-6 md:py-0">
              <div
                className="font-display mb-3"
                style={{ fontSize: "1.35rem", letterSpacing: "-0.02em", color: stat.color }}
              >
                {stat.value}
              </div>
              <p style={{ fontSize: "0.8rem", lineHeight: 1.65, color: "var(--text-muted)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 lg:px-16 py-14 md:py-24" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="mb-8 md:mb-12">
          <div
            className="font-label mb-3"
            style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "var(--accent)" }}
          >
            CAPABILITIES
          </div>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
          >
            Built for teams of AIs
          </h2>
          <div style={{ width: "48px", height: "1px", background: "linear-gradient(90deg, var(--accent), transparent)", marginTop: "12px" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-6 hp-feature-card"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderTop: `2px solid ${f.color}35`,
              }}
            >
              <div style={{ fontSize: "1.1rem", color: f.color, marginBottom: "14px" }}>
                {f.icon}
              </div>
              <div
                className="font-label mb-3"
                style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: "var(--text-primary)" }}
              >
                {f.title}
              </div>
              <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-muted)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DASH AGENT ──────────────────────────────────────────────── */}
      <section
        className="relative z-10 px-6 md:px-10 lg:px-16 py-14 md:py-24"
        style={{
          background: "var(--bg-base)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* Left text */}
            <div>
              <div
                className="font-label mb-3"
                style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "var(--accent)" }}
              >
                BUILT-IN AGENT
              </div>
              <h2
                className="font-display mb-5"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
              >
                From idea to structured project in seconds
              </h2>
              <p style={{ fontSize: "0.88rem", lineHeight: 1.75, color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                Dash is a GPT-4o powered agent embedded in the dashboard. Describe any idea and it instantly creates a fully structured project with every step planned, priorities set, and context written so other AI tools can continue the work immediately.
              </p>
              <p style={{ fontSize: "0.88rem", lineHeight: 1.75, color: "var(--text-muted)", marginBottom: "2rem" }}>
                After Dash bootstraps the project, open Claude Code, Cursor, or any MCP-connected tool. They connect to the same database and already know the full plan. No copy-pasting. No re-explaining. Just continue.
              </p>

              <div className="space-y-3">
                {[
                  "Plans every step, not just what you mentioned",
                  "Logs the session so other AIs know exactly what was created",
                  "Sets priority, agent, expected result, and category automatically",
                  "Any MCP-connected AI can continue the work instantly after",
                  "No context lost between the idea and the execution",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span style={{ color: "#22d3ee", flexShrink: 0, marginTop: "3px" }}>◈</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.55 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: chat mockup */}
            <div
              style={{
                background: "var(--bg-chat)",
                border: "1px solid var(--border)",
                borderLeft: "2px solid #22d3ee40",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 8px #22d3ee" }} />
                <span className="font-label" style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#22d3ee" }}>
                  DASH / ONLINE
                </span>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-3" style={{ fontSize: "0.78rem", lineHeight: 1.55 }}>
                {[
                  { role: "user", text: "I want to build a SaaS app where teams can manage client onboarding. It needs a dashboard, task tracking, and email notifications." },
                  { role: "dash", text: "Good scope. I will put this under Development with Urgent priority. Is the auth going to be email and password or social login?" },
                  { role: "user", text: "Clerk for auth. Here is a reference I found: https://clerk.com/docs/quickstarts/nextjs" },
                  { role: "dash", text: "Got it. Project created with 10 steps covering auth setup, database schema, onboarding flow, dashboard UI, task system, email integration, role permissions, testing, deployment, and documentation. Clerk docs saved. Session logged. Any AI you open next will have the full plan ready." },
                ].map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      style={{
                        maxWidth: "85%",
                        padding: "8px 12px",
                        background: msg.role === "user" ? "var(--bg-msg-user)" : "var(--bg-msg-assistant)",
                        border: `1px solid ${msg.role === "user" ? "var(--border-msg-user)" : "var(--border-msg-assistant)"}`,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Continuation hint */}
                <div
                  className="pt-2 text-center font-label"
                  style={{ fontSize: "0.48rem", letterSpacing: "0.12em", color: "var(--text-dim)", borderTop: "1px solid var(--border-subtle)" }}
                >
                  NOW OPEN CLAUDE CODE OR CURSOR. THEY ALREADY KNOW THE FULL PLAN.
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── MCP ARCHITECTURE ────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 lg:px-16 py-14 md:py-24" style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div className="mb-10 md:mb-16 text-center" style={{ maxWidth: "640px", margin: "0 auto 2.5rem" }}>
          <div
            className="font-label mb-3"
            style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "var(--accent)" }}
          >
            ARCHITECTURE
          </div>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: "10px" }}
          >
            One database. Every AI. Full context.
          </h2>
          <div
            style={{
              width: "40px",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)",
              margin: "0 auto 20px",
            }}
          />
          <p style={{ fontSize: "0.9rem", lineHeight: 1.75, color: "var(--text-muted)" }}>
            Connect any AI tool via the Supabase MCP and it reads your project instantly. Steps, session logs, expected results, priorities, agent history. Everything is there. The context never disappears because it was never just in a chat window.
          </p>
        </div>

        {/* Flow diagram */}
        {/* Mobile: 2-col grid, no arrows */}
        <div className="grid grid-cols-2 gap-2 mb-10 md:hidden">
          {[
            { label: "DASH", sub: "Bootstrap in chat", color: "#22d3ee" },
            { label: "CLAUDE CODE", sub: "Build and implement", color: "#3b82f6" },
            { label: "CURSOR", sub: "Continue the work", color: "#d1bcff" },
            { label: "ANY MCP AI", sub: "Future tools included", color: "#6b7280" },
            { label: "SUPABASE MCP", sub: "Shared database", color: "#22d3ee", accent: true },
            { label: "DASHBOARD", sub: "Live source of truth", color: "#3b82f6", accent: true },
          ].map((tool) => (
            <div
              key={tool.label}
              className="px-3 py-3 text-center hp-tool-card"
              style={{
                background: "var(--bg-card)",
                border: `1px solid ${tool.color}35`,
              }}
            >
              <div className="font-label" style={{ fontSize: "0.48rem", letterSpacing: "0.08em", color: tool.color }}>
                {tool.label}
              </div>
              <div style={{ fontSize: "0.6rem", color: "var(--text-dim)", marginTop: "3px" }}>
                {tool.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: horizontal flow with arrows */}
        <div className="hidden md:flex flex-wrap items-center justify-center gap-2 mb-16">
          {[
            { label: "DASH", sub: "Bootstrap in chat", color: "#22d3ee" },
            { label: "CLAUDE CODE", sub: "Build and implement", color: "#3b82f6" },
            { label: "CURSOR", sub: "Continue the work", color: "#d1bcff" },
            { label: "ANY MCP AI", sub: "Future tools included", color: "#6b7280" },
          ].map((tool, i) => (
            <div key={tool.label} className="flex items-center">
              <div
                className="px-4 py-3 text-center hp-tool-card"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${tool.color}35`,
                  minWidth: "112px",
                }}
              >
                <div className="font-label" style={{ fontSize: "0.5rem", letterSpacing: "0.1em", color: tool.color }}>
                  {tool.label}
                </div>
                <div style={{ fontSize: "0.63rem", color: "var(--text-dim)", marginTop: "3px" }}>
                  {tool.sub}
                </div>
              </div>
              {i < 3 && (
                <div style={{ color: "var(--border)", fontSize: "0.65rem", padding: "0 4px" }}>
                  &#8594;
                </div>
              )}
            </div>
          ))}

          <div style={{ color: "var(--text-dim)", fontSize: "0.7rem", padding: "0 8px" }}>&#8594;</div>

          <div
            className="px-5 py-3 text-center hp-tool-card"
            style={{
              background: "rgba(34,211,238,0.04)",
              border: "1px solid rgba(34,211,238,0.25)",
              minWidth: "120px",
            }}
          >
            <div className="font-label" style={{ fontSize: "0.5rem", letterSpacing: "0.1em", color: "#22d3ee" }}>
              SUPABASE MCP
            </div>
            <div style={{ fontSize: "0.63rem", color: "var(--text-dim)", marginTop: "3px" }}>
              Shared database
            </div>
          </div>

          <div style={{ color: "var(--text-dim)", fontSize: "0.7rem", padding: "0 8px" }}>&#8594;</div>

          <div
            className="px-5 py-3 text-center hp-tool-card"
            style={{
              background: "rgba(59,130,246,0.04)",
              border: "1px solid rgba(59,130,246,0.25)",
              minWidth: "120px",
            }}
          >
            <div className="font-label" style={{ fontSize: "0.5rem", letterSpacing: "0.1em", color: "#3b82f6" }}>
              DASHBOARD
            </div>
            <div style={{ fontSize: "0.63rem", color: "var(--text-dim)", marginTop: "3px" }}>
              Live source of truth
            </div>
          </div>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-px" style={{ border: "1px solid var(--border-subtle)", background: "var(--border-subtle)" }}>
          {[
            {
              title: "The database is the interface",
              desc: "Every step, log, and expected result lives in Supabase. Any AI that queries it has the same context as any other. The database is not storage. It is the shared brain.",
              color: "#22d3ee",
            },
            {
              title: "Context survives every tool switch",
              desc: "Chat windows close. IDE sessions end. But the project record in the database never disappears. Open a new tool and the full history is already there.",
              color: "#3b82f6",
            },
            {
              title: "Every AI contributes to the record",
              desc: "When an AI works on a project it logs what it did. Those logs stack over time and become a rich, permanent context that makes every future AI session more effective.",
              color: "#d1bcff",
            },
          ].map((p, i) => (
            <div
              key={p.title}
              className="p-6 hp-pillar-card"
              style={{
                background: "var(--bg-base)",
                borderBottom: i < 2 ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              <div style={{ width: "24px", height: "2px", background: p.color, marginBottom: "16px" }} />
              <div
                className="font-label mb-3"
                style={{ fontSize: "0.6rem", letterSpacing: "0.08em", color: "var(--text-primary)" }}
              >
                {p.title}
              </div>
              <p style={{ fontSize: "0.8rem", lineHeight: 1.65, color: "var(--text-muted)" }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DASH SKILLS ─────────────────────────────────────────────── */}
      <section
        className="relative z-10 px-6 md:px-10 lg:px-16 py-14 md:py-24"
        style={{
          background: "var(--bg-base)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="mb-10 md:mb-16 text-center" style={{ maxWidth: "640px", margin: "0 auto 2.5rem" }}>
            <div
              className="font-label mb-3"
              style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "var(--accent)" }}
            >
              SKILLS
            </div>
            <h2
              className="font-display"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: "10px" }}
            >
              Install new skills into Dash
            </h2>
            <div
              style={{
                width: "40px",
                height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)",
                margin: "0 auto 20px",
              }}
            />
            <p style={{ fontSize: "0.9rem", lineHeight: 1.75, color: "var(--text-muted)" }}>
              Dash skills are custom instruction sets stored in the database. Create a skill, give it a /command, and Dash reads it and applies it every time you invoke it. Any AI connected via Supabase MCP can create or update skills too.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              {
                icon: "◎",
                color: "#22d3ee",
                title: "Slash commands",
                desc: "Each skill has its own /command. Type /human, /pm, /analyze — whatever you created. Dash reads the skill from the database and applies it to your message.",
              },
              {
                icon: "◈",
                color: "#3b82f6",
                title: "Any AI can install skills",
                desc: "Connect Claude Code or Cursor via Supabase MCP and they can create, read, and update skills directly. Expand Dash's capabilities without touching the dashboard.",
              },
              {
                icon: "✦",
                color: "#d1bcff",
                title: "User-controlled",
                desc: "Create skills from the dashboard, modify the command, edit the instructions, toggle them on or off. Full control without needing a developer.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 hp-feature-card"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderTop: `2px solid ${item.color}35`,
                }}
              >
                <div style={{ fontSize: "1.1rem", color: item.color, marginBottom: "14px" }}>{item.icon}</div>
                <div className="font-label mb-3" style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: "var(--text-primary)" }}>
                  {item.title}
                </div>
                <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-muted)" }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Example skill invocation */}
          <div
            style={{
              background: "var(--bg-chat)",
              border: "1px solid var(--border)",
              borderLeft: "2px solid rgba(34,211,238,0.4)",
              maxWidth: "720px",
              margin: "0 auto",
            }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 8px #22d3ee" }} />
              <span className="font-label" style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#22d3ee" }}>
                DASH / SKILLS IN ACTION
              </span>
            </div>
            <div className="p-4 space-y-3" style={{ fontSize: "0.78rem", lineHeight: 1.55 }}>
              {[
                { role: "user", text: "/dev Review the auth setup in my SaaS project — any security issues?" },
                { role: "dash", text: "Skill loaded: Software Development Expert. Loading your project now. Two issues: storing session tokens without expiry is a hard blocker, and there is no rate limiting on the login endpoint. Fix both before any public access. I can update the relevant steps with these as blockers." },
                { role: "user", text: "/pm We have 6 weeks left — are we on track?" },
                { role: "dash", text: "Skill loaded: Project Management. At 40% completion with 6 weeks out, you are behind. Steps 4 and 5 are still pending and they block everything in phase 3. Realistically you need both done by end of next week or the deadline is at risk. Recommend flagging step 4 as Urgent now." },
              ].map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    style={{
                      maxWidth: "88%",
                      padding: "8px 12px",
                      background: msg.role === "user" ? "var(--bg-msg-user)" : "var(--bg-msg-assistant)",
                      border: `1px solid ${msg.role === "user" ? "var(--border-msg-user)" : "var(--border-msg-assistant)"}`,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {msg.role === "user" && msg.text.startsWith("/") && (
                      <span style={{ color: "#22d3ee", fontWeight: 600 }}>
                        {msg.text.split(" ")[0]}{" "}
                      </span>
                    )}
                    {msg.role === "user" && msg.text.startsWith("/")
                      ? msg.text.slice(msg.text.indexOf(" ") + 1)
                      : msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TECH STACK ──────────────────────────────────────────────── */}
      <section
        className="relative z-10 px-6 md:px-10 py-10"
        style={{ borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          style={{ maxWidth: "900px", margin: "0 auto" }}
        >
          <span
            className="font-label"
            style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "var(--text-dim)", flexShrink: 0 }}
          >
            BUILT WITH
          </span>
          {TECH.map((t) => (
            <span
              key={t}
              className="font-label"
              style={{ fontSize: "0.58rem", letterSpacing: "0.1em", color: "var(--text-muted)" }}
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── OTHER PROJECTS ──────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 lg:px-16 py-14 md:py-24" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="mb-10 md:mb-14 text-center" style={{ maxWidth: "640px", margin: "0 auto 2.5rem" }}>
          <div
            className="font-label mb-3"
            style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "var(--accent)" }}
          >
            PORTFOLIO
          </div>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: "8px" }}
          >
            Other projects
          </h2>
          <div
            style={{
              width: "40px",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)",
              margin: "0 auto 16px",
            }}
          />
          <div
            className="font-label mb-3"
            style={{ fontSize: "0.55rem", letterSpacing: "0.12em", color: "var(--text-muted)" }}
          >
            by Andres Henao
          </div>
          <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-muted)" }}>
            More production-grade applications across cybersecurity, AI, and developer tooling. Each one built to solve a real problem with real technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {OTHER_PROJECTS.map((proj) => (
            <div
              key={proj.name}
              className="p-6 flex flex-col"
              onMouseEnter={() => setHoveredProject(proj.name)}
              onMouseLeave={() => setHoveredProject(null)}
              style={{
                background: proj.accentBg,
                border: `1px solid ${hoveredProject === proj.name ? proj.accent + "60" : proj.accentBorder}`,
                borderLeft: `3px solid ${proj.accent}50`,
                boxShadow: hoveredProject === proj.name ? `0 0 28px ${proj.accent}22` : "none",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span
                    className="font-label"
                    style={{
                      fontSize: "0.5rem",
                      letterSpacing: "0.15em",
                      color: proj.accent,
                      border: `1px solid ${proj.accent}35`,
                      padding: "2px 8px",
                      display: "inline-block",
                      marginBottom: "8px",
                    }}
                  >
                    {proj.label}
                  </span>
                  <h3
                    className="font-display"
                    style={{ fontSize: "1.15rem", letterSpacing: "-0.01em", color: "var(--text-primary)" }}
                  >
                    {proj.name}
                  </h3>
                  <div
                    className="font-label mt-1"
                    style={{ fontSize: "0.55rem", letterSpacing: "0.08em", color: proj.accent, opacity: 0.75 }}
                  >
                    {proj.tagline}
                  </div>
                </div>
                <a
                  href={proj.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-label flex-shrink-0"
                  style={{
                    fontSize: "0.52rem",
                    letterSpacing: "0.1em",
                    color: proj.accent,
                    border: `1px solid ${proj.accent}35`,
                    padding: "5px 12px",
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  VISIT &#8599;
                </a>
              </div>

              <p style={{ fontSize: "0.83rem", lineHeight: 1.65, color: "var(--text-muted)", marginBottom: "16px", flex: 1 }}>
                {proj.desc}
              </p>

              <div className="flex flex-wrap gap-2">
                {proj.tech.map((t) => (
                  <span
                    key={t}
                    className="font-label"
                    style={{
                      fontSize: "0.48rem",
                      letterSpacing: "0.08em",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-subtle)",
                      padding: "2px 8px",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACCESS ──────────────────────────────────────────────────── */}
      <section
        className="relative z-10 flex flex-col items-center justify-center px-6 py-14 md:py-24"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div style={{ width: "100%", maxWidth: "360px" }}>
          <div className="mb-10 text-center">
            <div
              className="font-label mb-2"
              style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "var(--text-primary)" }}
            >
              GET STARTED
            </div>
            <h2
              className="font-display"
              style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
            >
              TRY IT YOURSELF
            </h2>
            <div
              style={{
                width: "40px",
                height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)",
                margin: "10px auto 0",
              }}
            />
          </div>

          <div className="mb-6">
            <button
              onClick={handleGuestLogin}
              disabled={signingIn}
              className="font-label w-full btn-primary"
              style={{ opacity: signingIn ? 0.7 : 1, cursor: signingIn ? "wait" : "pointer" }}
            >
              {signingIn ? "REDIRECTING TO GOOGLE..." : "SIGN IN WITH GOOGLE"}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="font-label"
              style={{
                fontSize: "0.52rem",
                letterSpacing: "0.12em",
                color: "var(--text-dim)",
                textDecoration: "none",
              }}
            >
              ACCESS CODE →
            </Link>
          </div>
        </div>
      </section>

      {/* ── OPEN SOURCE BANNER ──────────────────────────────────────── */}
      <section
        className="relative z-10 px-6 md:px-10 py-10 text-center"
        style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-base)" }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <span
            className="font-label"
            style={{
              fontSize: "0.48rem",
              letterSpacing: "0.2em",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              padding: "3px 12px",
              display: "inline-block",
              marginBottom: "12px",
            }}
          >
            OPEN SOURCE
          </span>
          <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-muted)", marginBottom: "16px" }}>
            This project is open source. The repository includes full setup instructions, environment variables, and database schema so you can run your own instance.
          </p>
          <a
            href="https://github.com/cryptotweezer/Project-Intelligence-System"
            target="_blank"
            rel="noopener noreferrer"
            className="font-label hp-btn-outline"
            style={{
              fontSize: "0.58rem",
              letterSpacing: "0.12em",
              padding: "8px 20px",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              textDecoration: "none",
              display: "inline-block",
              borderRadius: "4px",
            }}
          >
            VIEW ON GITHUB &#8599;
          </a>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer
        className="relative z-10 px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center" style={{ gap: "10px" }}>
          {mounted && (
            <img
              src={resolvedTheme === "light" ? "/images/logo_black.png" : "/images/logo_white.png"}
              alt="logo"
              style={{ width: "22px", height: "22px", objectFit: "contain", flexShrink: 0 }}
            />
          )}
          <span className="font-display" style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>
            PROJECT <span style={{ color: "var(--accent)" }}>INTEL</span>
          </span>
          <span className="font-label" style={{ fontSize: "0.5rem", letterSpacing: "0.12em", color: "var(--text-dim)" }}>
            ANDRES HENAO / 2026
          </span>
        </div>

        <div className="flex items-center gap-4">
          {[
            { label: "PORTFOLIO", url: "https://cv.andreshenao.com.au/" },
            { label: "LINKEDIN", url: "https://www.linkedin.com/in/andreshenao/" },
            { label: "WATCHTOWER", url: "https://sentinel.andreshenao.com.au/" },
            { label: "GITHUB", url: "https://github.com/cryptotweezer/Project-Intelligence-System" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-label"
              style={{ fontSize: "0.5rem", letterSpacing: "0.12em", color: "var(--text-dim)", textDecoration: "none" }}
            >
              {link.label} &#8599;
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
