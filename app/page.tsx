"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TYPING_WORDS = ["SECURE SYSTEM ACCESS", "TWEEZER"];
const TYPE_SPEED = 80;
const DELETE_SPEED = 50;
const PAUSE_MS = 3500;

function useTypingEffect() {
  const [displayed, setDisplayed] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = TYPING_WORDS[wordIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx < word.length) {
      timeout = setTimeout(() => setCharIdx((c) => c + 1), TYPE_SPEED);
    } else if (!deleting && charIdx === word.length) {
      timeout = setTimeout(() => setDeleting(true), PAUSE_MS);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx((c) => c - 1), DELETE_SPEED);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % TYPING_WORDS.length);
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
  const router = useRouter();
  const typedText = useTypingEffect();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: MASTER_EMAIL,
        password,
      });

      if (authError) {
        setError("ACCESS DENIED — INVALID CREDENTIALS");
        setPassword("");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <main className="min-h-screen bg-obsidian flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(68,143,255,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Hairline grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Login container */}
      <div className="relative z-10 w-full max-w-sm px-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-16">
          <div className="font-label text-[10px] text-outline mb-3 tracking-[0.3em]" style={{ minHeight: "1em" }}>
            {typedText}
            <span style={{ opacity: 1, animation: "blink 1s step-end infinite" }}>▌</span>
          </div>
          <h1
            className="font-display text-2xl text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            PROJECT INTEL
          </h1>
          <div
            className="mt-1 mx-auto"
            style={{
              width: "40px",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)",
            }}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          <div>
            <input
              id="master-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ACCESS CODE"
              autoComplete="current-password"
              required
              className="obsidian-input"
            />
          </div>

          {/* Error */}
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
          >
            {isPending ? "AUTHENTICATING..." : "INITIALIZE SESSION"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-16 text-center font-label text-outline opacity-30"
          style={{ fontSize: "0.55rem", letterSpacing: "0.2em" }}>
          UNAUTHORIZED ACCESS PROHIBITED
        </div>
      </div>
    </main>
  );
}
