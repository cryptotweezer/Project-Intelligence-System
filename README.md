# Project Intelligence System

An AI-native project management dashboard built around a single idea: the database is the interface. Every project lives in Supabase — structured, queryable, and fully readable by any AI tool. Switch between Claude Code, Cursor, Windsurf, or any MCP-connected AI without losing context. Each tool picks up exactly where the last one left off.

**Live demo:** [intel.andreshenao.com.au](https://intel.andreshenao.com.au)  
**Built by:** [Andres Henao](https://cv.andreshenao.com.au)

---

## The Core Idea

Most AI-assisted workflows break down when you switch tools. You re-explain the project, re-establish context, re-describe what was already done. Every new session starts from zero.

PIS solves this by keeping all project state in a shared Supabase database. Steps, logs, expected results, priorities, agent history — everything is structured and queryable. Any AI that connects via the Supabase MCP reads the full project state instantly. No copy-pasting. No re-explaining. The context never disappears because it was never just in a chat window.

**The two-phase workflow:**

1. **Bootstrap with Dash** — describe an idea in the chat widget. Dash (GPT-4o) plans the full project: every step, priority, expected result, reference links, and an opening session log. All written to the database in seconds.

2. **Continue with any AI** — open Claude Code, Cursor, or any MCP-connected tool. Connect to your Supabase project. The AI reads the full plan and picks up immediately.

---

## Capabilities

### Project Management
- Create projects with name, description, expected result, category, priority, agent, and GitHub repo
- Three standard priorities: **Urgent**, **Scheduled**, **Someday** — plus free-form custom values (dates, quarters, anything)
- Project statuses: active, paused, done, archived
- Full lifecycle: create → work → complete → archive, with validation before marking done
- Reactivate completed projects back to active from the completed view
- Inline editing of description and expected result directly on the project page

### Step Planning
- Each project has ordered steps with titles, descriptions, and individual statuses: pending, in_progress, done, error
- Drag-and-drop reordering within the project detail page
- Error steps show inline editable notes for tracking what went wrong
- Done steps are visually muted; completion percentage recalculates automatically as steps change
- Add steps via a modal form; delete steps with automatic renumbering

### Project Notes
- Save freeform research, findings, and insights directly to a project
- Stored in the `project_notes` table — separate from session logs, intended for reference material
- Notes appear on the project detail page below Expected Result, always visible with an empty-state prompt when none exist
- Scrollable container (capped at 480px height) — long notes do not push the page
- Delete any note with one click (confirmation required)
- Ask Dash to research a topic and save the findings as a note: "research the best libraries for X and save a note"

### Session Logging
- Every significant action creates a permanent session log: summary, problems encountered, solutions applied, agent name, date
- Logs are ordered newest-first and accumulate over the project lifetime
- Any AI working on the project reads these logs to understand what happened before it arrived
- Dash logs every session automatically — no manual input required

### Dash Persistent Memory
- Dash remembers key facts across conversations without any database storage
- Facts are saved in `localStorage` under `dash-memory` (max 25 entries) and injected into every system prompt
- Tell Dash to remember anything: "remember that this project uses React 18 and Supabase free tier"
- Memory survives page refresh, tab changes, and navigation — cleared only by the user or by explicit instruction to Dash
- Dash manages its own memory: adds new facts, replaces outdated ones, keeps the list concise

### Dash AI Agent
- GPT-4o powered chat widget accessible from every dashboard page
- Conversational project intake: Dash asks only what it doesn't already know, suggests obvious values, groups questions naturally
- Creates the full project structure in one conversation: steps, links, opening log — nothing left empty
- Operates on live data: can update step statuses, add steps, change priorities, write logs, save links — all from chat
- **Web search** via Tavily API — Dash can search the internet when asked; results saved to the active project or personal library depending on context
- **Developer info tool** — ask Dash who built this or about the developer; it calls a dedicated tool instead of guessing
- 25 tools covering the full project lifecycle, personal link management, skills management, and web search
- Guest users get 20 Dash messages (DB-enforced, cannot be bypassed by cache or refresh)

### Dash Skills — Custom AI Instruction Sets
- Create reusable skills that extend Dash's behavior with a `/command` (e.g. `/pm`, `/dev`, `/analyze`)
- Each skill is a prompt-engineered instruction set: role definition, domain knowledge, behavioral rules, output format
- Invoke a skill by prefixing any Dash message: `/pm plan this feature` → Dash reads the skill from DB and applies it
- When Dash creates a skill, it acts as a prompt engineer — it writes a comprehensive instruction set, not a transcription of what you said
- Manage skills from the dashboard: drag-and-drop sorting, inline create, view/edit toggle on detail page, delete with confirmation
- Every user gets a `/pm` starter skill pre-loaded on first sign-in (via Supabase trigger)
- Guest limit: 3 skills total (1 pre-loaded + 2 custom)
- Owner: unlimited skills

### AI Integration via Supabase MCP
- Any AI tool with Supabase MCP support connects directly to your database
- Full project context available: steps, logs, expected results, priorities, agent history
- AIs can update step statuses, write session logs, and read full project state
- The dashboard becomes a shared source of truth for any number of AI tools

### Personal Link Library
- Save any URL to a personal library: YouTube videos, Twitter/X posts, articles, web pages
- Rich metadata fetched automatically: title, description, thumbnail, site name, source type
- YouTube thumbnails extracted directly from video ID — no API key needed
- Twitter/X uses the oEmbed API — works without login, extracts author and tweet text
- 2-4 AI-suggested tags generated per link from content keywords
- Filter by platform, toggle hide/show viewed, mark as read, delete

### Dashboard UX
- Drag-and-drop project sorting with three modes: Urgency, Date, Custom — persisted in localStorage
- Full dark mode (OLED-optimized) and light mode with CSS variable system
- Mobile-responsive layout with slide-in sidebar overlay and hamburger menu
- Multi-user: owner uses email/password, guests sign in with Google OAuth and get isolated data
- First-time guest onboarding tour (driver.js) — 7 steps covering navigation, links, projects, Dash, skills, and the MCP architecture

### Lead Tracker (owner only)
- Reads contact form submissions and registered users from a separate Supabase project
- Intended for use alongside a resume or portfolio site
- Stats: total leads, last 7 days count, registered user count
- Delete functionality for both leads and users directly from the dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 — App Router, server components, server actions |
| Database | Supabase (PostgreSQL) — main PIS project + optional Resume project |
| AI Agent | OpenAI GPT-4o with tool-calling loop (max 20 iterations) |
| Web Search | Tavily API (used by Dash for real-time internet search) |
| Auth | Supabase Auth — email/password for owner, Google OAuth for guests |
| Styling | Tailwind CSS + CSS variables (dark/light theme) |
| Drag and Drop | @dnd-kit/core + @dnd-kit/sortable |
| Theme | next-themes |
| Tour | driver.js |
| Deployment | Vercel |

---

## Installation

### 1. Clone and install

```bash
git clone https://github.com/cryptotweezer/Project-Intelligence-System.git
cd Project-Intelligence-System
npm install
```

### 2. Create your Supabase project

Go to [supabase.com](https://supabase.com) and create a new project. You will need the **Project URL**, **anon key**, and **service role key** from Settings > API.

### 3. Run the database schema

In your Supabase project, open the **SQL Editor** and run:

```sql
-- Core tables
create table projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  slug            text not null,
  name            text not null,
  description     text,
  expected_result text,
  category        text,
  priority        text default 'Someday',
  status          text default 'active' check (status in ('active','paused','done','archived')),
  agent           text default 'Dash' check (agent in ('Claude','Emma','Dash','All')),
  github_repo     text,
  completion_pct  integer default 0,
  created_at      timestamptz default now()
);

create table project_steps (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  step_number integer not null,
  title       text not null,
  description text,
  notes       text,
  status      text default 'pending' check (status in ('pending','in_progress','done','error')),
  created_at  timestamptz default now()
);

create table project_logs (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  step_id      uuid references project_steps(id) on delete set null,
  agent        text,
  session_date date default current_date,
  summary      text,
  problems     text,
  solutions    text,
  archived     boolean default false,
  created_at   timestamptz default now()
);

create table project_links (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  url        text not null,
  title      text,
  created_at timestamptz default now()
);

create table links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  url         text not null,
  title       text,
  description text,
  image_url   text,
  site_name   text,
  favicon_url text,
  source_type text default 'web' check (source_type in ('youtube','twitter','instagram','facebook','web','other')),
  tags        text[] default '{}',
  notes       text,
  is_read     boolean default false,
  created_at  timestamptz default now()
);

-- Guest usage tracking
create table guest_limits (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  dash_messages_used   integer default 0,
  has_seen_tour        boolean default false,
  created_at           timestamptz default now()
);

-- Dash Skills
create table dash_skills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  command     text not null,
  description text,
  content     text not null,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  unique (user_id, command)
);

-- Project notes (research, findings, insights)
create table project_notes (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  title      text,
  content    text not null,
  agent      text default 'Dash',
  created_at timestamptz default now()
);

-- AI agent event log (read-only in UI)
create table agent_logs (
  id         uuid primary key default gen_random_uuid(),
  event      text,
  payload    jsonb,
  created_at timestamptz default now()
);
```

### 4. Enable Row Level Security

```sql
-- Enable RLS on all user-scoped tables
alter table projects       enable row level security;
alter table project_steps  enable row level security;
alter table project_logs   enable row level security;
alter table project_links  enable row level security;
alter table links          enable row level security;
alter table guest_limits   enable row level security;
alter table dash_skills    enable row level security;
alter table project_notes  enable row level security;

-- Policy: users only see their own rows
create policy "own_rows" on projects       for all using (user_id = auth.uid());
create policy "own_rows" on project_steps  for all using (user_id = auth.uid());
create policy "own_rows" on project_logs   for all using (user_id = auth.uid());
create policy "own_rows" on project_links  for all using (user_id = auth.uid());
create policy "own_rows" on links          for all using (user_id = auth.uid());
create policy "own_rows" on guest_limits   for all using (user_id = auth.uid());
create policy "own_rows" on dash_skills    for all using (user_id = auth.uid());
create policy "own_rows" on project_notes  for all using (user_id = auth.uid());
```

### 5. Add the Dash message counter function

```sql
create or replace function increment_dash_messages(p_user_id uuid)
returns integer
language plpgsql security definer as $$
declare
  new_count integer;
begin
  insert into guest_limits (user_id, dash_messages_used)
  values (p_user_id, 1)
  on conflict (user_id)
  do update set dash_messages_used = guest_limits.dash_messages_used + 1
  returning dash_messages_used into new_count;
  return new_count;
end;
$$;
```

### 6. Add the default skill trigger

This inserts a starter `/pm` skill for every new user automatically on sign-up:

```sql
create or replace function insert_default_skills()
returns trigger language plpgsql security definer as $$
begin
  insert into public.dash_skills (user_id, name, command, description, content, is_active)
  values (
    new.id,
    'Project Manager',
    '/pm',
    'Senior PM mode — structured planning, milestone breakdowns, risk surfacing',
    'You are a senior project manager with deep experience across software development, business operations, and events. When invoked, you enter structured planning mode. Think in phases: discovery, planning, execution, review. For any goal or project the user describes, produce a complete breakdown covering phases, key deliverables, dependencies, risks the user has not mentioned, and a concrete recommended next action. Do not describe what the user should do in abstract terms — give them a sequenced plan they can execute immediately. If the scope is unclear, ask one focused clarifying question before producing anything. Surface blockers proactively: if a dependency is missing, name it. If a deadline is tight given the scope, say so directly with a revised recommendation. For status updates or check-ins, assess momentum (is the project moving or stalled?), identify the single biggest risk, and state the next action. Be direct. No filler. Every response must move the project forward.',
    true
  )
  on conflict (user_id, command) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_skills
  after insert on auth.users
  for each row execute procedure insert_default_skills();
```

**Backfill for existing users** (run once after adding the trigger):

```sql
insert into public.dash_skills (user_id, name, command, description, content, is_active)
select
  id,
  'Project Manager',
  '/pm',
  'Senior PM mode — structured planning, milestone breakdowns, risk surfacing',
  'You are a senior project manager with deep experience across software development, business operations, and events. When invoked, you enter structured planning mode. Think in phases: discovery, planning, execution, review. For any goal or project the user describes, produce a complete breakdown covering phases, key deliverables, dependencies, risks the user has not mentioned, and a concrete recommended next action. Do not describe what the user should do in abstract terms — give them a sequenced plan they can execute immediately. If the scope is unclear, ask one focused clarifying question before producing anything. Surface blockers proactively: if a dependency is missing, name it. If a deadline is tight given the scope, say so directly with a revised recommendation. For status updates or check-ins, assess momentum (is the project moving or stalled?), identify the single biggest risk, and state the next action. Be direct. No filler. Every response must move the project forward.',
  true
from auth.users
where not exists (
  select 1 from public.dash_skills
  where dash_skills.user_id = auth.users.id
    and dash_skills.command = '/pm'
);
```

### 7. Enable auto-cleanup for guest data (optional)

Requires the `pg_cron` extension (available on Supabase Pro). Enable it in Dashboard > Database > Extensions, then:

```sql
create or replace function delete_old_guest_data()
returns void language plpgsql security definer as $$
declare owner_id uuid;
begin
  -- Replace with your owner UUID
  owner_id := '00000000-0000-0000-0000-000000000000';
  delete from projects
  where user_id != owner_id
    and created_at < now() - interval '30 days';
  delete from links
  where user_id != owner_id
    and created_at < now() - interval '30 days';
  delete from guest_limits
  where user_id != owner_id
    and created_at < now() - interval '30 days';
  delete from dash_skills
  where user_id != owner_id
    and created_at < now() - interval '30 days';
end;
$$;

select cron.schedule('cleanup-guest-data', '0 3 * * *', 'select delete_old_guest_data()');
```

### 8. Configure Supabase Auth

In your Supabase Dashboard:

**For owner password login:**
- Authentication > Providers > Email — enable it
- Disable "Confirm email" and disable "Enable email signup" (existing users only, no public registration)
- Authentication > Users > Add user — create your owner account (email + password)

**For Google OAuth (guests):**
- Authentication > Providers > Google — enable it and add your Google OAuth credentials
- Authentication > URL Configuration > Redirect URLs — add `http://localhost:3000/auth/callback` for local dev and your production URL for prod

### 9. Set up environment variables

Create `.env.local` in the project root:

```env
# Main Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Owner identity (server-side only — never use NEXT_PUBLIC prefix)
OWNER_EMAIL=you@example.com

# OpenAI (for the Dash agent)
OPENAI_API_KEY=sk-...

# Tavily (for Dash web search — optional but recommended)
TAVILY_API_KEY=tvly-...

# Optional: second Supabase project for Lead Tracker
RESUME_SUPABASE_URL=
RESUME_SUPABASE_ANON_KEY=

# Optional
ANTHROPIC_API_KEY=
```

> The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and is used by the Dash agent to write to the database on behalf of users. Keep it secret — server-side only, never in client code.

> `TAVILY_API_KEY` is optional. If omitted, Dash will skip web search gracefully. Get a key at [tavily.com](https://tavily.com).

### 10. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the owner credentials you created in step 8.

---

## Connecting AI Tools via Supabase MCP

The Supabase MCP (Model Context Protocol) lets any compatible AI tool connect directly to your database and read full project context — steps, logs, expected results, priorities, agent history — without needing documentation or onboarding.

Once connected, you can ask the AI things like:
- "What projects are currently active and what is the status of each?"
- "Read the full plan for the trading bot project and continue where the last AI left off"
- "Mark step 4 of the auth system project as done and write a session log"
- "What problems has any AI encountered on this project?"

### Get your Supabase access token

Go to [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) and create a new personal access token. This is different from the project anon key — it authenticates you as a Supabase user and gives the MCP server access to your projects.

### Claude Code

Add to `.claude/settings.json` in your project directory (project-scoped) or `~/.claude/settings.json` (global):

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

Your project ref is the ID in your Supabase project URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`.

### Claude Desktop

Add to `claude_desktop_config.json` (on macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`, on Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

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

### Cursor

Create `.cursor/mcp.json` in your project directory:

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

### Windsurf

In Windsurf, go to Settings > MCP Servers > Add Server and use the same configuration as above. Alternatively create a `mcp_config.json` in your project root with the same structure.

### What the AI sees once connected

With the MCP active, any AI can query your database directly. The most useful tables to work with:

| Table | What it contains |
|---|---|
| `projects` | Name, description, expected result, category, priority, status, completion percentage |
| `project_steps` | All steps for a project, ordered by step_number, with status and notes |
| `project_logs` | Full session history — what each AI did, problems hit, solutions found |
| `project_links` | Reference URLs tied to each project |
| `project_notes` | Research findings and insights saved to a project |
| `dash_skills` | Custom instruction sets per user, invoked by /command in Dash |

**Useful queries to run when starting a session:**

```sql
-- See all active projects
select id, name, priority, completion_pct, status
from projects
where status in ('active', 'paused')
order by created_at desc;

-- Get full context for a specific project
select * from project_steps where project_id = 'YOUR_PROJECT_ID' order by step_number;
select * from project_logs where project_id = 'YOUR_PROJECT_ID' order by created_at desc limit 5;
select * from project_links where project_id = 'YOUR_PROJECT_ID';
```

---

## Project Structure

```
app/
  page.tsx                         # Public homepage
  login/page.tsx                   # Owner password login
  auth/callback/route.ts           # Supabase OAuth redirect handler
  dashboard/
    layout.tsx                     # Server component — auth guard, renders DashboardShell
    DashboardShell.tsx             # Client layout — sidebar, top bar, chat widget
    page.tsx                       # Overview — active/paused projects, DnD sort, tour
    projects/
      page.tsx                     # Full project list
      [slug]/page.tsx              # Project detail — steps, logs, links, editable fields
    completed/page.tsx             # Done/archived projects with reactivate option
    links/page.tsx                 # Personal link library
    leads/page.tsx                 # Lead Tracker (owner only)
    skills/
      page.tsx                     # Skills list — DnD sort, inline create, guest limit bar
      SkillsClient.tsx             # Client component — accordion cards, drag handles, create form
      [slug]/
        page.tsx                   # Skill detail page — breadcrumb, header
        SkillEditForm.tsx          # View/edit toggle — read mode first, edit on demand
  actions/
    overview.ts                    # Project/step/log/link mutations
    links.ts                       # Personal link mutations
    leads.ts                       # Lead Tracker mutations
    tour.ts                        # markTourSeen()
    skills.ts                      # createSkill, updateSkill, deleteSkill
  api/
    chat/route.ts                  # Dash agent — GPT-4o tool-calling loop
    fetch-link-meta/route.ts       # URL metadata fetcher
lib/
  auth.ts                          # getCurrentUser() — id, email, isOwner, name, avatarUrl
  supabase/                        # Supabase clients (server, client, admin, resume)
  chat/
    tools.ts                       # 25 Dash tools (projects, steps, logs, links, skills, search)
    system-prompt.ts               # Dash system prompt
    developer-info.ts              # Static developer info returned by get_developer_info tool
  links/metadata.ts                # URL metadata fetcher (YouTube, Twitter, og:tags)
  types.ts                         # Shared TypeScript types
  slug.ts                          # Project slug generation
components/
  OnboardingTour.tsx               # driver.js 7-step guest tour
```

---

## Available Commands

```bash
npm run dev          # Development server with hot reload
npm run build        # Production build
npm start            # Run production server
npm run lint         # ESLint
```

---

## Deployment

The easiest path is [Vercel](https://vercel.com):

1. Push your repo to GitHub
2. Import the repo in Vercel
3. Add all environment variables from `.env.local` in Vercel project settings
4. Add your production URL to:
   - Supabase Auth > URL Configuration > Redirect URLs
   - Google Cloud Console > OAuth 2.0 Client > Authorized redirect URIs
5. Deploy

---

## License

MIT — free to use, fork, and modify.
