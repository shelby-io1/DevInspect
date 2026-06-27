# DevInspect

AI-powered code review SaaS. Analyze GitHub repositories or uploaded ZIP files using static analysis and LLM. Identifies bugs, security issues, performance bottlenecks, code smells, and generates documentation and unit tests.

## Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend**: Next.js API Routes, Supabase (PostgreSQL, Auth, Storage)
- **Static Analysis**: ESLint, Ruff, Semgrep, Bandit (planned)
- **AI**: Provider-agnostic architecture (Qwen3-Coder default)

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Setup

Create the required tables by running the SQL from `supabase/migrations/00001_create_repositories.sql` in your Supabase dashboard SQL editor. Or visit `/api/v1/setup` to check setup status.

## Project Structure

```
apps/web/src/
├── app/
│   ├── api/v1/          # API routes
│   ├── dashboard/       # Dashboard pages
│   ├── auth/            # Auth pages + actions
│   └── page.tsx         # Landing page
├── components/
│   ├── ui/              # Reusable UI components
│   ├── auth/            # Auth form
│   └── repositories/    # Repository dialogs
└── lib/
    ├── supabase/        # Supabase clients
    ├── github.ts        # GitHub API client
    ├── types.ts         # Shared types
    └── env.ts           # Environment validation
```

## Progress

- Phase 1: Foundation — Complete
- Phase 2: Repository Management — Complete
- Phase 3–7: In development
