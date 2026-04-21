# Project Intelligence System — AI Context Skill

**Pass this file to your AI before starting any session.** It gives your AI complete understanding of the system, database schema, available tools, and how to work with the project without any additional explanation.

---

## What This System Is

**Project Intelligence System (PIS)** is an AI-native project management dashboard built on Next.js 14 and Supabase. The core idea: the database is the interface. Every project — its steps, logs, notes, links, and history — lives in Supabase in structured, queryable form. Any AI tool with Supabase MCP access can read full project context instantly and continue work without re-explanation.

**Two-phase workflow:**
1. **Dash (GPT-4o widget)** bootstraps projects from natural language — creates the full structure: steps, expected result, reference links, opening log.
2. **Any MCP-connected AI** (Claude Code, Cursor, Windsurf, etc.) connects to Supabase, reads the full plan, and picks up where Dash left off.

**Live demo:** [intel.andreshenao.com.au](https://intel.andreshenao.com.au)

---

## Database Schema

All tables live in the `public` schema. RLS is enabled on every table — rows are scoped to `user_id = auth.uid()`.

### `projects`
Core project record.
```sql
id              uuid PK
user_id         uuid FK auth.users
slug            text        -- URL-safe identifier, used for routing (/dashboard/projects/[slug])
name            text
description     text
expected_result text        -- The concrete deliverable or outcome the project aims for
category        text        -- Free-form (e.g. "Development", "Business", "Personal")
priority        text        -- "Urgent" | "Scheduled" | "Someday" | any custom string
status          text        -- "active" | "paused" | "done" | "archived"
agent           text        -- "Claude" | "Emma" | "Dash" | "All"
github_repo     text
completion_pct  integer     -- 0-100, recalculated on every step status change
created_at      timestamptz
```

### `project_steps`
Ordered steps for a project.
```sql
id          uuid PK
project_id  uuid FK projects
user_id     uuid FK auth.users
step_number integer         -- 1-based order
title       text
description text
notes       text            -- Used for error notes; also read-only display for non-error steps
status      text            -- "pending" | "in_progress" | "done" | "error"
created_at  timestamptz
```

### `project_logs`
Session history — what each AI did, problems hit, solutions found.
```sql
id           uuid PK
project_id   uuid FK projects
user_id      uuid FK auth.users
step_id      uuid FK project_steps (nullable)
agent        text            -- Which AI wrote this log ("Dash", "Claude", "Emma", etc.)
session_date date
summary      text            -- What was accomplished this session
problems     text            -- Blockers or errors encountered
solutions    text            -- What resolved the problems
archived     boolean
created_at   timestamptz
```

### `project_links`
Reference URLs tied to a specific project (documentation, repos, specs, etc.).
```sql
id         uuid PK
project_id uuid FK projects
user_id    uuid FK auth.users
url        text
title      text
created_at timestamptz
```

### `project_notes`
Freeform research findings and insights saved to a project.
```sql
id         uuid PK
project_id uuid FK projects
user_id    uuid FK auth.users
title      text (nullable)
content    text
agent      text            -- Which AI saved this note
created_at timestamptz
```

### `links`
Personal link library — NOT tied to any project.
```sql
id          uuid PK
user_id     uuid FK auth.users
url         text
title       text
description text
image_url   text
site_name   text
favicon_url text
source_type text  -- "youtube" | "twitter" | "instagram" | "facebook" | "web" | "other"
tags        text[]
notes       text
is_read     boolean
created_at  timestamptz
```

### `dash_skills`
Custom AI instruction sets per user, invoked by `/command` in Dash.
```sql
id          uuid PK
user_id     uuid FK auth.users
name        text
command     text            -- Always starts with "/" (e.g. "/pm", "/dev", "/analyze")
description text
content     text            -- The full instruction set / system prompt extension
is_active   boolean
created_at  timestamptz
UNIQUE (user_id, command)
```

### `guest_limits`
Tracks guest usage — message count and onboarding tour status.
```sql
user_id              uuid PK FK auth.users
dash_messages_used   integer
has_seen_tour        boolean
created_at           timestamptz
```

---

## Connecting via Supabase MCP

Add this to your AI tool's MCP config (Claude Code: `.claude/settings.json`, Cursor: `.cursor/mcp.json`, Claude Desktop: `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token", "YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN",
        "--project-ref", "YOUR_PROJECT_REF"
      ]
    }
  }
}
```

Get your personal access token at: supabase.com/dashboard/account/tokens  
Your project ref is the ID in your Supabase project URL.

---

## Essential Queries for Starting a Session

```sql
-- List all active projects with progress
SELECT id, name, slug, priority, status, completion_pct, agent
FROM projects
WHERE status IN ('active', 'paused')
ORDER BY created_at DESC;

-- Get full context for one project
SELECT * FROM projects WHERE slug = 'your-project-slug';

-- Read all steps
SELECT step_number, title, description, status, notes
FROM project_steps
WHERE project_id = 'PROJECT_ID'
ORDER BY step_number;

-- Read recent session history
SELECT agent, session_date, summary, problems, solutions
FROM project_logs
WHERE project_id = 'PROJECT_ID'
ORDER BY created_at DESC
LIMIT 5;

-- Read reference links
SELECT url, title FROM project_links WHERE project_id = 'PROJECT_ID';

-- Read saved notes/research
SELECT title, content, agent, created_at
FROM project_notes
WHERE project_id = 'PROJECT_ID'
ORDER BY created_at DESC;
```

---

## Writing Back to the Database

Always scope writes with the correct `user_id`. The owner UUID is the authenticated Supabase user for the session.

### Update a step status
```sql
UPDATE project_steps
SET status = 'done'  -- 'pending' | 'in_progress' | 'done' | 'error'
WHERE id = 'STEP_ID';

-- Then recalculate completion_pct on the parent project
UPDATE projects
SET completion_pct = (
  SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'done') / NULLIF(COUNT(*), 0))
  FROM project_steps WHERE project_id = 'PROJECT_ID'
)
WHERE id = 'PROJECT_ID';
```

### Write a session log
```sql
INSERT INTO project_logs (project_id, user_id, agent, session_date, summary, problems, solutions)
VALUES (
  'PROJECT_ID',
  'USER_ID',
  'Claude',                    -- or 'Cursor', 'Windsurf', whatever AI you are
  CURRENT_DATE,
  'What was accomplished...',
  'Any blockers encountered...',
  'How they were resolved...'
);
```

### Save a note
```sql
INSERT INTO project_notes (project_id, user_id, title, content, agent)
VALUES ('PROJECT_ID', 'USER_ID', 'Optional title', 'Research findings...', 'Claude');
```

### Add a step
```sql
INSERT INTO project_steps (project_id, user_id, step_number, title, description, status)
VALUES (
  'PROJECT_ID',
  'USER_ID',
  (SELECT COALESCE(MAX(step_number), 0) + 1 FROM project_steps WHERE project_id = 'PROJECT_ID'),
  'Step title',
  'Optional description',
  'pending'
);
```

---

## Authentication Model

- **Owner** — identified by `OWNER_EMAIL` env var. Logs in via email/password. Has unlimited access to all features.
- **Guests** — sign in via Google OAuth. Full dashboard access with isolated data. Limited to 20 Dash messages and 3 skills.
- **RLS** — every table has `USING (user_id = auth.uid())` policy. Rows are automatically scoped per user.
- **Service role key** — the Dash agent uses this to bypass RLS and write on behalf of users. Never expose to the client.
- `getCurrentUser()` in `lib/auth.ts` returns `{ id, email, isOwner, name?, avatarUrl? }` — wrapped with React `cache()` to deduplicate auth calls within a single request.

---

## Dash Agent — What It Can Do

Dash is the built-in GPT-4o chat widget. It has 25+ tools covering the full project lifecycle. When you connect via MCP, you complement Dash — Dash handles chat-driven updates, you handle complex implementation.

### Tool categories
| Category | Tools |
|---|---|
| Projects | `list_projects`, `get_project`, `create_project`, `update_project`, `delete_project` |
| Steps | `create_step`, `update_step`, `delete_step`, `move_step`, `move_step_to` |
| Logs | `create_log`, `delete_log` |
| Project links | `create_link`, `list_links`, `delete_link` |
| Personal links | `save_link`, `list_saved_links`, `delete_saved_link`, `mark_link_read` |
| Notes | `create_note`, `list_notes`, `delete_note` |
| Skills | `list_skills`, `create_skill`, `update_skill`, `delete_skill` |
| Memory | `save_memory` — saves key facts to localStorage (max 25 entries) |
| Web search | `web_search` via Tavily API — searches the internet and saves results |
| Info | `get_developer_info` |

### Project creation flow (what Dash always does)
1. `create_project` — saves and gets back the project ID
2. `create_step` for EVERY step — thorough planning, not just what was mentioned
3. `create_link` for every URL shared in the conversation
4. `create_log` — ALWAYS at the end of every session with write operations

### Project links vs personal links
- `create_link` → `project_links` table — reference URL tied to a specific project
- `save_link` → `links` table — personal library (YouTube, articles, etc.), no project_id

---

## Dash Skills System

Skills extend Dash's behavior with reusable instruction sets.

- Invoked by prefixing a message: `/pm plan this project` or `/dev review this API design`
- Dash reads the skill content from `dash_skills` and applies it as a system-level instruction
- Every user gets a `/pm` starter skill auto-inserted on sign-up via a Supabase trigger (`insert_default_skills()`, must be `SECURITY DEFINER`)
- Skills are managed from `/dashboard/skills` — create, edit, toggle active/inactive, reorder, delete

**To create a skill via SQL (if needed):**
```sql
INSERT INTO dash_skills (user_id, name, command, description, content, is_active)
VALUES (
  'USER_ID',
  'Skill Name',
  '/command',
  'Short description',
  'Full instruction set here...',
  true
)
ON CONFLICT (user_id, command) DO NOTHING;
```

---

## Architecture Patterns to Know

### Server components read directly from Supabase
No API routes for reads. Dashboard pages are server components that call `createClient()` and query the DB directly.
```typescript
const supabase = await createClient(); // always await — it's async
const { data } = await supabase.from("projects").select("*").eq("user_id", user.id);
```

### Mutations go through server actions
All writes use `"use server"` functions in `app/actions/`. They always call `revalidatePath()` after mutations.

### Never trust user_id from request body
`userId` is always derived server-side from `supabase.auth.getUser()`. Never from form data or request body.

### Caching
- `experimental.staleTimes.dynamic: 30` in `next.config.mjs` — 30-second client-side router cache
- `getCurrentUser()` wrapped with React `cache()` — deduplicates auth calls within a single request
- `export const dynamic = "force-dynamic"` on pages with external data (Lead Tracker)

### Slug generation
Projects get a URL-safe slug from their name (`lib/slug.ts`). Routes use `/dashboard/projects/[slug]` not `/dashboard/projects/[id]`.

---

## What NOT to Do

- Do not hardcode dark-only colors — always use CSS variables (`var(--bg-*)`, `var(--text-*)`, `var(--border-*)`)
- Do not skip `await` on `createClient()` — it is async
- Do not add backticks or markdown inside system prompt template literals — breaks GPT-4o formatting
- Do not set `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_` prefix — server-side only
- Do not trust `userId` from request body — always from `supabase.auth.getUser()` server-side
- Do not lower the Dash tool-calling loop limit below 20 — large projects need 12-15+ calls
- Do not create the `insert_default_skills()` trigger without `SECURITY DEFINER` — it runs before a user session exists and RLS will block the insert, causing "Database error saving new user" on signup

---

## File Map (Quick Reference)

```
app/
  page.tsx                    Public homepage
  login/page.tsx              Owner password login
  auth/callback/route.ts      Google OAuth handler
  dashboard/
    layout.tsx                Auth guard (server)
    DashboardShell.tsx        Sidebar, nav, chat widget (client)
    page.tsx                  Overview — projects + stats + DnD
    projects/[slug]/page.tsx  Project detail — steps, logs, notes, links
    completed/page.tsx        Done/archived projects
    links/page.tsx            Personal link library
    leads/page.tsx            Lead Tracker (owner only)
    skills/                   Skills management UI
  actions/
    overview.ts               Project, step, log, link mutations
    links.ts                  Personal link mutations
    skills.ts                 Skill CRUD
    tour.ts                   markTourSeen()
  api/
    chat/route.ts             Dash agent (GPT-4o, max 20 iterations)
    fetch-link-meta/route.ts  URL metadata fetcher
lib/
  auth.ts                     getCurrentUser() with React cache()
  supabase/server.ts          Supabase SSR client
  supabase/admin.ts           Service role client (bypasses RLS)
  chat/tools.ts               All 25+ Dash tools
  chat/system-prompt.ts       Dash system prompt builder
  links/metadata.ts           YouTube/Twitter/og:tag metadata fetcher
  types.ts                    Shared TypeScript types
  slug.ts                     Slug generation
skills/
  pis.md                      This file — AI context skill
```

---

## Recommended Session Start Checklist

When beginning a new session on any project:

1. Query `projects` to find the project by name or slug
2. Read all `project_steps` ordered by `step_number` — identify current status
3. Read the last 3-5 `project_logs` — understand what was done and what problems exist
4. Read `project_notes` — check for research or context saved by previous sessions
5. Read `project_links` — reference URLs for this project
6. Begin work — update step statuses as you go
7. Write a `project_logs` entry when you finish — include what you did, any problems, what was resolved

This is the same flow Dash follows. Any AI following these steps has full context within seconds.
