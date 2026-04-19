"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message = { role: "user" | "assistant"; content: string };

// Renders assistant message: strips markdown, makes URLs clickable blue links
function MessageContent({ text }: { text: string }) {
  // Strip non-link markdown first
  const cleaned = text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1");

  // One pass: find markdown links [label](url) and bare URLs, in order
  const PATTERN = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(https?:\/\/[^\s]+)/g;

  const segments: Array<{ text?: string; href?: string; label?: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = PATTERN.exec(cleaned)) !== null) {
    if (m.index > last) segments.push({ text: cleaned.slice(last, m.index) });
    if (m[1] && m[2]) {
      // markdown link [label](url)
      segments.push({ href: m[2], label: m[1] });
    } else {
      // bare URL — trim trailing punctuation that isn't part of the URL
      const url = m[0].replace(/[.,;:!?]+$/, "");
      const trail = m[0].slice(url.length);
      segments.push({ href: url, label: url });
      if (trail) segments.push({ text: trail });
    }
    last = m.index + m[0].length;
  }
  if (last < cleaned.length) segments.push({ text: cleaned.slice(last) });

  return (
    <>
      {segments.map((seg, i) =>
        seg.href ? (
          <a
            key={i}
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#3b82f6", textDecoration: "underline", wordBreak: "break-all" }}
          >
            {seg.label}
          </a>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

function RobotIcon({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Antenna */}
      <line x1="12" y1="1" x2="12" y2="4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="1" r="1.2" fill={color} />
      {/* Head */}
      <rect x="3.5" y="5" width="17" height="13" rx="2.5" stroke={color} strokeWidth="1.5" />
      {/* Eyes */}
      <rect x="7" y="9" width="3" height="3" rx="0.6" fill={color} />
      <rect x="14" y="9" width="3" height="3" rx="0.6" fill={color} />
      {/* Mouth */}
      <rect x="7.5" y="14" width="9" height="1.5" rx="0.75" fill={color} />
      {/* Ear connectors */}
      <line x1="3.5" y1="10.5" x2="1.5" y2="10.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20.5" y1="10.5" x2="22.5" y2="10.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function ChatWidget({ userId, isOwner }: { userId: string; isOwner: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("chat_messages");
      return stored ? (JSON.parse(stored) as Message[]) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Persist messages
  useEffect(() => {
    localStorage.setItem("chat_messages", JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Auto-resize textarea as content grows
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Track scroll position in messages container
  function handleMessagesScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 80);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = (await res.json()) as { message: string };
      setIsOnline(true);
      setMessages([...nextMessages, { role: "assistant", content: data.message }]);
    } catch {
      setIsOnline(false);
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Connection error. Try again." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [input, loading, messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const statusColor = isOnline ? "#3b82f6" : "#ffb2be";
  const statusGlow = isOnline
    ? "0 0 6px rgba(59,130,246,0.8)"
    : "0 0 6px rgba(255,178,190,0.8)";

  return (
    <div ref={containerRef} style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}>

      {/* ── Chat Panel ───────────────────────────────────────── */}
      {isOpen && (
        <div
          className="animate-fade-in"
          style={{
            position: "absolute",
            bottom: "0",
            right: "0",
            width: "min(380px, calc(100vw - 32px))",
            height: "min(520px, calc(100vh - 100px))",
            maxHeight: "calc(100vh - 100px)",
            background: "var(--bg-chat)",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.06)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-subtle)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: statusColor,
                  boxShadow: statusGlow,
                  transition: "all 0.3s ease",
                }}
              />
              <span
                className="font-label"
                style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "var(--text-secondary)" }}
              >
                DASH
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title="Clear chat"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-dim)",
                    fontSize: "0.6rem",
                    fontFamily: "inherit",
                    letterSpacing: "0.1em",
                    padding: "2px 6px",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
                >
                  CLEAR
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-dim)",
                  fontSize: "14px",
                  lineHeight: 1,
                  padding: "2px 4px",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                  padding: "0 8px",
                }}
              >
                <div style={{ opacity: 0.5, color: statusColor, transition: "color 0.3s ease" }}>
                  <RobotIcon size={36} color={statusColor} />
                </div>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <p style={{
                    margin: 0,
                    fontSize: "0.88rem",
                    fontWeight: 400,
                    color: "var(--text-primary)",
                    lineHeight: 1.4,
                  }}>
                    Hi, I&apos;m Dash
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: "0.72rem",
                    fontWeight: 300,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}>
                    Your project management assistant. Tell me what you&apos;re building and I&apos;ll take care of the rest.
                  </p>
                </div>
                <span
                  className="font-label"
                  style={{
                    fontSize: "0.46rem",
                    letterSpacing: "0.2em",
                    color: statusColor,
                    opacity: 0.5,
                    transition: "color 0.3s ease",
                  }}
                >
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    fontWeight: 300,
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    ...(msg.role === "user"
                      ? {
                          background: "var(--bg-msg-user)",
                          border: "1px solid var(--border-msg-user)",
                          color: "var(--text-primary)",
                        }
                      : {
                          background: "var(--bg-msg-assistant)",
                          border: "1px solid var(--border-msg-assistant)",
                          color: "var(--text-secondary)",
                        }),
                  }}
                >
                  {msg.role === "assistant"
                    ? <MessageContent text={msg.content} />
                    : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "var(--bg-msg-assistant)",
                    border: "1px solid var(--border-msg-assistant)",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: "rgba(59,130,246,0.6)",
                        display: "inline-block",
                        animation: `blink 1.2s ease-in-out ${d * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll-to-bottom button */}
          {showScrollBtn && (
            <button
              onClick={scrollToBottom}
              title="Jump to latest"
              style={{
                position: "absolute",
                bottom: "8px",
                right: "12px",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(59,130,246,0.85)",
                border: "none",
                cursor: "pointer",
                color: "#000d1a",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                zIndex: 10,
              }}
            >
              ▼
            </button>
          )}
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border-subtle)",
              flexShrink: 0,
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Message..."
              rows={1}
              style={{
                flex: 1,
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 0,
                color: "var(--text-primary)",
                fontSize: "16px",
                fontFamily: "Roboto, sans-serif",
                fontWeight: 300,
                padding: "8px 10px",
                outline: "none",
                resize: "none",
                lineHeight: "1.4",
                maxHeight: "180px",
                overflowY: "auto",
                transition: "border-color 0.15s ease",
                height: "auto",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? "rgba(59,130,246,0.15)" : "#3b82f6",
                border: "none",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                color: loading || !input.trim() ? "rgba(59,130,246,0.4)" : "#000d1a",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "12px",
                transition: "background 0.15s ease",
              }}
            >
              ▲
            </button>
          </div>
        </div>
      )}

      {/* ── Toggle Button ─────────────────────────────────────── */}
      <button
        data-tour="dash-fab"
        onClick={() => setIsOpen((v) => !v)}
        title={isOpen ? "Close Dash" : "Open Dash"}
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "#3b82f6",
          border: "none",
          cursor: "pointer",
          display: isOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 20px rgba(59,130,246,0.4), 0 4px 16px rgba(0,0,0,0.5)",
          transition: "all 0.2s ease",
          color: "#000d1a",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 28px rgba(59,130,246,0.6), 0 4px 20px rgba(0,0,0,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 0 20px rgba(59,130,246,0.4), 0 4px 16px rgba(0,0,0,0.5)";
        }}
      >
        <RobotIcon size={24} color="#000d1a" />
      </button>
    </div>
  );
}
