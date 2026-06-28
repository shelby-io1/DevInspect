# DevInspect

AI-powered code review SaaS. Analyze GitHub repositories or uploaded ZIP files using static analysis and LLM. Identifies bugs, security issues, performance bottlenecks, code smells, and generates documentation and unit tests.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes + FastAPI (Python), Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI**: Provider-agnostic (mock default, Ollama supported)

## Features

- **Repository analysis** — Import from GitHub or upload ZIP, run static + AI analysis
- **Dashboard** — Score cards, charts, recent repos, average scores per repo (latest analysis only)
- **PR Review** — Paste a GitHub PR URL + number, get AI review with issues, suggestions, and verdict
- **Teams** — Create teams, invite members by email, share repositories with team members
- **Team Chat** — Real-time inline chat per team with unread badges on sidebar and chat icon
- **Analysis history** — View past analyses with drill-down to issues, AI reports, and code
- **Code generation** — Generate documentation and unit tests from analysis results
- **Notifications** — In-app notifications for analysis completion and PR reviews

## Getting Started

```bash
# Install dependencies
cd apps/web && npm install
cd backend && pip install -r requirements.txt

# Environment
cp .env.example .env.local
# Fill in your Supabase credentials (URL, anon key, service_role key)

# Run both servers
npm run dev          # Next.js on port 3000
uvicorn app.main:app --port 8005  # FastAPI on port 8005
```

Open [http://localhost:3000](http://localhost:3000).

## Database Setup

1. Start the dev server
2. Visit `http://localhost:3000/api/v1/setup/sql`
3. Copy the entire SQL output
4. Paste into your Supabase SQL Editor and run

This creates all tables (`repositories`, `analyses`, `teams`, `team_messages`, etc.) and RLS policies.

## Project Structure

```
apps/web/src/
├── app/
│   ├── api/v1/           # API routes (analysis, repos, teams, review, chat, etc.)
│   ├── dashboard/        # Dashboard, repos, teams, PR review pages
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # Reusable UI components (shadcn)
│   ├── repositories/     # Import, share, analysis buttons
│   └── ...               # Charts, chat, nav badges, error boundary
└── lib/
    ├── supabase/         # Server + client Supabase helpers
    ├── env.ts            # Environment validation (Zod)
    └── github.ts         # GitHub API client

backend/
├── app/
│   ├── main.py           # FastAPI app with analysis, generation, review endpoints
│   ├── analyzers.py      # Static analysis (ESLint, Ruff, etc.)
│   ├── ai/               # AI provider wrappers (mock, ollama, prompts, schemas)
│   └── models.py         # Pydantic models
└── tests/                # pytest tests
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | For team features | Supabase service role key (user lookup) |
| `BACKEND_URL` | Yes | FastAPI backend URL (default: http://localhost:8005) |
