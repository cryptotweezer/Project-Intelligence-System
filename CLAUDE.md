# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (hot reload)
npm run build     # Production build
npm start         # Run production server
npm run lint      # ESLint
npm run dev -- --hostname 0.0.0.0 #  http://192.168.8.111:3000
```

No test framework is configured.

## Architecture

**Project Intelligence System** — A Next.js 14 dashboard for monitoring AI agent projects. Single-user app (master account: `cryptotweezer@gmail.com`) backed by Supabase.

### Routing & Auth

- `app/page.tsx` — Public login page (has ThemeToggle top-right)
- `app/dashboard/*` — Protected routes (server components that fetch directly from Supabase)
- `middleware.ts` — Protects `/dashboard/*`; redirects unauthenticated users to `/`, authenticated users away from login
- `app/dashboard/layout.tsx` — **Client component** (uses hooks for sign-out + `useTheme` for logo swap); wraps all dashboard pages in sidebar nav

### Data Layer

Dashboard pages are **server components** that call `createClient()` from `lib/supabase/server` and query Supabase directly — no API routes for reads.

All **mutations** go through server actions in `app/actions/overview.ts` (`"use server"`):
- `deleteProject`, `deleteLog`, `deleteStep`
- `updateStepStatus`, `updateProjectField`, `moveStep`, `createStep`
- `updateProjectPriority`, `updateProjectStatus`, `updateProjectAgent`
- `markProjectDone` — validates all steps done, sets status="done", redirects to /dashboard/completed

Each action calls `revalidatePath` to invalidate the relevant pages.

Interactive components are `"use client"` wrappers that import and call these server actions:
- `DeleteProjectButton`, `DeleteLogButton`, `DeleteLinkButton`, `DeleteStepButton`
- `StepStatusSelect`, `EditableField`, `CreateStepForm`, `MoveStepButtons`
- `PrioritySelect` — clickable badge dropdown + custom text input for free-form priorities
- `StatusSelect` — clickable badge dropdown: `active` / `paused`
- `AgentSelect` — clickable label dropdown: `Claude` / `Emma` / `Both` / `Dash`
- `MarkCompleteButton` — shown only when `completion_pct === 100` and status is not done/archived
- `ThemeToggle` — pill toggle in sidebar and login page

### Database Tables

- `projects` — core project data; `completion_pct` is **stored in DB** (not computed from steps); no CHECK constraint on `priority` (removed to allow custom values)
- `project_steps` — ordered steps per project; ordered by `step_number`
- `project_logs` — work session records (summary, problems, solutions, agent, date) per project; ordered by `created_at DESC` (not `session_date`)
- `project_links` — useful links per project
- `agent_logs` — AI agent task execution events (separate from project logs; read-only in UI)

Types are generated in `lib/supabase/types.ts`; domain types (enums, interfaces) live in `lib/types.ts`.

### Key Type Definitions

```typescript
// lib/types.ts
ProjectPriority: "Urgent" | "Scheduled" | "Someday" | (string & {})  // custom values allowed
ProjectAgent:    "Claude" | "Emma" | "Both" | "Dash"
ProjectStatus:   "active" | "paused" | "done" | "archived"
StepStatus:      "pending" | "in_progress" | "done" | "error"
```

### Styling

Tailwind CSS with a dark/OLED sci-fi aesthetic. `darkMode: "class"` is enabled — theme class applied to `<html>`.

- **Theme system**: CSS variables in `:root` (dark defaults) and `html.light` overrides in `app/globals.css`. All colors use `var(--bg-*)`, `var(--text-*)`, `var(--border-*)` etc. Do not hardcode dark-only colors.
- **ThemeProvider**: `app/components/ThemeProvider.tsx` wraps the app via `app/layout.tsx` using `next-themes` with `attribute="class"`, `defaultTheme="dark"`, `storageKey="pis-theme"`.
- **Logo**: `public/image/logo_white.png` (dark mode) and `public/image/logo_black.png` (light mode) — swap via `useTheme` + `mounted` pattern in layout.
- Custom design tokens in `tailwind.config.ts`: `electric-blue`, `royal-purple`, `ruby-red`, surface layers `surface-*`
- Reusable CSS classes in `app/globals.css`: `.glass-panel`, `.badge`, `.badge-urgent`, `.badge-normal`, `.badge-scheduled`, `.badge-someday`, `.badge-custom`, `.badge-active`, `.badge-paused`, `.badge-done`, `.badge-archived`, `.btn-primary`, progress bar classes, etc.
- Fonts: Roboto (body), Space Grotesk (display) via Google Fonts
- `.badge` has `line-height: 1; vertical-align: middle` — important for alignment with other inline elements

Prefer existing CSS classes over inline styles for patterns that already exist.

### Priority Values

Standard priorities: `Urgent`, `Scheduled`, `Someday`. Custom free-form strings are also valid (DB has no CHECK constraint). The `badge-custom` class (teal) is used for any non-standard value. Default priority when creating via Dash: `Scheduled`.

### Completed Tasks page (`/dashboard/completed`)

Projects with `status = "done"` or `"archived"`. Cards are read-only (no edit controls). `DeleteProjectButton` is present in the card header with `redirectTo="/dashboard/completed"`.

### AI Chat Agent — Dash

- Route: `app/api/chat/route.ts` — OpenAI gpt-4o with tool-calling loop
- Tools defined in `lib/chat/tools.ts` — no enum constraint on `priority` (accepts any string)
- System prompt in `lib/chat/system-prompt.ts` — references `Scheduled` as the standard mid-level priority
- Supabase admin client at `lib/supabase/admin.ts` using `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- Chat widget: `app/dashboard/ChatWidget.tsx` — opens at bottom of screen, close button only inside panel

#### Dash as a Project Bootstrapper — Key Concept for README / CV

Dash has full database permissions (via service role key): it can create projects, add steps, update statuses, log sessions, delete records, and query anything — all through natural language from the chat widget inside the dashboard.

**The intended workflow is two-phase:**

1. **Bootstrap with Dash** — Use the chat widget to rapidly scaffold a new project: define the name, category, priority, expected result, and initial step breakdown. Dash creates the full skeleton in the database in seconds. This gives every project a structured, queryable foundation before a single line of code is written.

2. **Refine with any AI via Supabase MCP** — Because all project data lives in Supabase, any AI tool that supports the Supabase MCP (Claude Code, Cursor, etc.) can connect directly to the database and read, update, or extend the project without touching the codebase. The dashboard becomes a live source of truth that any AI can consume and write back to.

**Why this matters:**
- The dashboard is not tied to a single AI tool. It is an AI-agnostic project management layer.
- Any AI with MCP access can read the full project context (steps, logs, priority, expected results) and contribute — whether that is generating code, updating progress, or logging a work session.
- The dashboard URL gives visibility into every project from any device or context, while the database gives every AI the structured data it needs to act autonomously.
- Dash is intentionally lightweight — a fast starting point, not a final solution. The real value is that it turns a vague idea into a structured, AI-readable project record that any tool can then take further.

> **Note for README / CV integration**: This architecture should be highlighted as a demonstration of AI-native project management — where the database is the interface, the dashboard is the display layer, and any AI (past or future) can plug in via MCP and immediately understand the full context of any project without needing documentation or onboarding.

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection
- `SUPABASE_SERVICE_ROLE_KEY` — admin client for Dash tool calls
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` — AI services
- `STITCH_API` — External API
