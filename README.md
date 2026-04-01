# Project Intelligence System

A personal dashboard for managing AI agent projects. Built with Next.js 14 and Supabase.

## What it does

- Track projects with priority, status, assigned agent, and completion percentage
- Manage steps per project with reordering and status tracking
- Log work sessions with summaries, problems, and solutions
- View completed/archived projects separately
- Single-user, secure login

## Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS — dark/OLED aesthetic
- **Auth:** Supabase Auth (single master account)
- **Deployment:** Vercel

## Setup

```bash
npm install
npm run dev
```

Requires `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Coming soon

- AI chat agent with full database access (OpenAI GPT-4o)
