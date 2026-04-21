import arcjet, { shield, tokenBucket, detectBot } from "@arcjet/next";

// Base Arcjet client — shared across all routes.
// Each route wraps this with withRule() to add its own specific rules.
export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["ip.src"],
  rules: [
    // Shield blocks common attack patterns: SQLi, XSS, path traversal, etc.
    shield({ mode: "LIVE" }),
  ],
});

// Pre-configured client for /api/chat
// Token bucket allows bursts but enforces a sustained cap.
// Limits per IP — the route adds userId-based limiting on top via withRule().
export const ajChat = aj.withRule(
  detectBot({
    mode: "LIVE",
    allow: [], // block all bots — only real browsers should call this
  })
).withRule(
  tokenBucket({
    mode: "LIVE",
    refillRate: 5,   // 5 tokens per interval
    interval: 60,    // refill every 60 seconds
    capacity: 10,    // burst up to 10 requests
  })
);

// Pre-configured client for /api/fetch-link-meta
// Stricter limit — this endpoint does outbound fetches on every call.
export const ajLinkMeta = aj.withRule(
  tokenBucket({
    mode: "LIVE",
    refillRate: 10,  // 10 per minute sustained
    interval: 60,
    capacity: 20,    // burst up to 20
  })
);
