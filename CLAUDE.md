# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (hot reload)
npm run build     # Production build
npm start         # Run production server
npm run lint      # ESLint
```

## Architecture

**Project Intelligence System** — A Next.js 14 dashboard for monitoring AI agent projects. Single-user app (master account: `cryptotweezer@gmail.com`) backed by Supabase.

### Routing & Auth

- `app/page.tsx` — Public login page
- `app/dashboard/*` — Protected routes (server components that fetch directly from Supabase)
- `middleware.ts` — Protects `/dashboard/*`; redirects unauthenticated users to `/`, authenticated users away from login

### Data Layer

All dashboard pages are **server components** that call `createClient()` from `lib/supabase/server` and query Supabase directly — no API routes. The browser client (`lib/supabase/client`) is available for client components.

Database tables: `projects`, `project_steps`, `project_logs`, `agent_logs`. Types are generated in `lib/supabase/types.ts`; domain types (enums, interfaces) live in `lib/types.ts`.

### Styling

Tailwind CSS with a dark/OLED sci-fi aesthetic. Custom design tokens are in `tailwind.config.ts`:
- Colors: `electric-blue`, `royal-purple`, `ruby-red`, surface layers `surface-*`
- Reusable CSS classes (glass panels, badges, glow effects, buttons) are defined in `app/globals.css`
- Fonts: Roboto (body), Space Grotesk (display) via Google Fonts

Prefer existing CSS classes (`.glass-panel`, `.badge-priority-*`, `.btn-primary`, etc.) over inline styles for patterns that already exist.

### Key Type Definitions

```typescript
// lib/types.ts
ProjectPriority: "Urgent" | "Normal" | "Someday"
ProjectAgent:    "Claude" | "Emma" | "Both"
ProjectStatus:   "active" | "paused" | "done" | "archived"
StepStatus:      "pending" | "in_progress" | "done" | "error"
```

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` — AI services (currently unused in UI)
- `STITCH_API` — External API
