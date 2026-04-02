"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message = { role: "user" | "assistant"; content: string };

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

export default function ChatWidget() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
            bottom: "64px",
            right: "0",
            width: "380px",
            height: "520px",
            background: "rgba(10,10,10,0.98)",
            border: "1px solid rgba(65,71,84,0.35)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.06)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid rgba(65,71,84,0.2)",
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
                style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.7)" }}
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
                    color: "rgba(139,145,160,0.4)",
                    fontSize: "0.6rem",
                    fontFamily: "inherit",
                    letterSpacing: "0.1em",
                    padding: "2px 6px",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(139,145,160,0.8)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(139,145,160,0.4)")}
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
                  color: "rgba(139,145,160,0.5)",
                  fontSize: "14px",
                  lineHeight: 1,
                  padding: "2px 4px",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(139,145,160,0.5)")}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
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
                  gap: "10px",
                }}
              >
                <div style={{ opacity: 0.4, color: statusColor, transition: "color 0.3s ease" }}>
                  <RobotIcon size={32} color={statusColor} />
                </div>
                <span
                  className="font-label"
                  style={{
                    fontSize: "0.52rem",
                    letterSpacing: "0.2em",
                    color: statusColor,
                    opacity: 0.6,
                    transition: "color 0.3s ease",
                  }}
                >
                  {isOnline ? "DASH ONLINE" : "DASH OFFLINE"}
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
                    fontSize: "0.78rem",
                    fontWeight: 300,
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    ...(msg.role === "user"
                      ? {
                          background: "rgba(59,130,246,0.12)",
                          border: "1px solid rgba(59,130,246,0.2)",
                          color: "rgba(255,255,255,0.88)",
                        }
                      : {
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(65,71,84,0.2)",
                          color: "rgba(255,255,255,0.75)",
                        }),
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "8px 14px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(65,71,84,0.2)",
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

          {/* Input */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid rgba(65,71,84,0.2)",
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
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(65,71,84,0.25)",
                borderRadius: 0,
                color: "rgba(255,255,255,0.85)",
                fontSize: "0.78rem",
                fontFamily: "Roboto, sans-serif",
                fontWeight: 300,
                padding: "8px 10px",
                outline: "none",
                resize: "none",
                lineHeight: "1.4",
                maxHeight: "96px",
                overflowY: "auto",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(65,71,84,0.25)")}
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
        onClick={() => setIsOpen((v) => !v)}
        title={isOpen ? "Close Dash" : "Open Dash"}
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: isOpen ? "rgba(59,130,246,0.15)" : "#3b82f6",
          border: isOpen ? "1px solid rgba(59,130,246,0.4)" : "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isOpen
            ? "none"
            : "0 0 20px rgba(59,130,246,0.4), 0 4px 16px rgba(0,0,0,0.5)",
          transition: "all 0.2s ease",
          color: isOpen ? "rgba(59,130,246,0.7)" : "#000d1a",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.boxShadow = "0 0 28px rgba(59,130,246,0.6), 0 4px 20px rgba(0,0,0,0.5)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.boxShadow = "0 0 20px rgba(59,130,246,0.4), 0 4px 16px rgba(0,0,0,0.5)";
        }}
      >
        {isOpen
          ? <span style={{ fontSize: "15px", lineHeight: 1 }}>✕</span>
          : <RobotIcon size={24} color="#000d1a" />
        }
      </button>
    </div>
  );
}
