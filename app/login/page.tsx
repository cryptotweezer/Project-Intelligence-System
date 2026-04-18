"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/app/components/ThemeToggle";

const AI_TOOLS = ["Authorized Personnel Only", "Owner Access Required", "Restricted Zone"];
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

const MASTER_EMAIL = "cryptotweezer@gmail.com";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const typedText = useTypingEffect();

  // Show OAuth error passed via redirect from /auth/callback
  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError) setError(authError.toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
    // Sign out any existing session so the owner can always reach the password form
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) supabase.auth.signOut();
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: MASTER_EMAIL,
        password,
      });
      if (authError) {
        setError(authError.message.toUpperCase());
        setPassword("");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <div
      style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 md:px-10"
        style={{
          height: "56px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <Link href="/" className="flex items-center" style={{ gap: "10px", textDecoration: "none" }}>
          {mounted && (
            <img
              src={resolvedTheme === "light" ? "/images/logo_black.png" : "/images/logo_white.png"}
              alt="logo"
              style={{ width: "24px", height: "24px", objectFit: "contain" }}
            />
          )}
          <span className="font-display" style={{ fontSize: "0.9rem", letterSpacing: "-0.01em" }}>
            <span style={{ color: "var(--text-primary)" }}>PROJECT </span>
            <span style={{ color: "var(--accent)" }}>INTEL</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/"
            className="font-label"
            style={{
              fontSize: "0.52rem",
              letterSpacing: "0.12em",
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            ← BACK TO HOME
          </Link>
        </div>
      </nav>

      {/* Login form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.5rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: "360px" }}>
          <div className="mb-10 text-center">
            <div
              className="font-label mb-2"
              style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "var(--text-dim)" }}
            >
              SYSTEM ACCESS
            </div>
            <h1
              className="font-display"
              style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
            >
              PROJECT INTEL
            </h1>
            <div
              style={{
                width: "40px",
                height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)",
                margin: "10px auto 16px",
              }}
            />
            <div
              className="font-label"
              style={{ fontSize: "0.55rem", letterSpacing: "0.12em", color: "var(--text-dim)", minHeight: "1.2em" }}
            >
              {typedText}
              <span style={{ animation: "blink 1s step-end infinite" }}>▌</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ACCESS CODE"
              autoComplete="current-password"
              required
              className="obsidian-input"
              style={{ fontSize: "16px" }}
            />

            {error && (
              <div
                className="font-label text-ruby-red text-center animate-fade-in"
                style={{ fontSize: "0.6rem", letterSpacing: "0.12em" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !password}
              className="btn-primary"
              style={{ borderRadius: "4px" }}
            >
              {isPending ? "AUTHENTICATING..." : "INITIALIZE SESSION"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
