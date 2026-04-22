import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#000000",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top-left blue accent dot */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Bottom-right blue accent */}
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(209,188,255,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Top section — logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#3b82f6",
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.25em",
              color: "rgba(139,145,160,0.8)",
              textTransform: "uppercase",
            }}
          >
            intel.andreshenao.com.au
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 2,
                background: "#3b82f6",
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.2em",
                color: "#3b82f6",
                textTransform: "uppercase",
              }}
            >
              AI-Native Project Management
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#e2e2e2",
            }}
          >
            <span>Project </span>
            <span style={{ color: "#3b82f6" }}>Intelligence</span>
          </div>

          {/* Subheadline */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 300,
              lineHeight: 1.5,
              color: "rgba(226,226,226,0.6)",
              maxWidth: 700,
            }}
          >
            Stop re-explaining your projects to every AI. One shared database — any tool picks up exactly where you left off.
          </div>
        </div>

        {/* Bottom section — AI badges + tagline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* AI tool badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {["Claude", "Cursor", "Windsurf", "Codex", "Dash"].map((tool, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 14px",
                  border: "1px solid rgba(59,130,246,0.3)",
                  background: "rgba(59,130,246,0.06)",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  color: "rgba(59,130,246,0.9)",
                  textTransform: "uppercase",
                }}
              >
                {tool}
              </div>
            ))}
            <div
              style={{
                padding: "6px 14px",
                border: "1px solid rgba(65,71,84,0.3)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "rgba(139,145,160,0.5)",
              }}
            >
              ANY AI
            </div>
          </div>

          {/* Supabase MCP badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              border: "1px solid rgba(209,188,255,0.2)",
              background: "rgba(209,188,255,0.04)",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#d1bcff",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.15em",
                color: "rgba(209,188,255,0.7)",
                textTransform: "uppercase",
              }}
            >
              Powered by Supabase MCP
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
