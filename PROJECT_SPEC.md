# DevInspect -- Project Specification

## Vision

DevInspect is a production-quality AI-powered code review SaaS that
analyzes GitHub repositories or uploaded ZIP files using static analysis
and an LLM. It identifies bugs, security issues, performance
bottlenecks, code smells, generates documentation and unit tests, and
presents everything in a modern dashboard.

## Tech Stack

### Frontend

-   Next.js (App Router)
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   TanStack Query
-   Monaco Editor
-   React Hook Form
-   Zod

### Backend

-   FastAPI
-   Python
-   Uvicorn

### Database

-   Supabase
    -   PostgreSQL
    -   Auth
    -   Storage
    -   pgvector (future)

### AI

-   Provider-agnostic architecture
-   Default: Qwen3-Coder
-   Future: Gemini, OpenAI, Claude

### Static Analysis

-   ESLint
-   Ruff
-   Semgrep
-   Bandit
-   GitPython
-   Tree-sitter

### Deployment

-   Frontend: Vercel
-   Backend: Railway or Render
-   Database: Supabase
-   No Docker

## Engineering Rules

-   Build phase by phase only.
-   Production-quality code.
-   Strict TypeScript.
-   Modular architecture.
-   SOLID principles.
-   Reusable components.
-   Proper error/loading states.
-   Never hardcode secrets.
-   Use environment variables.
-   REST API.
-   Async where appropriate.

## UI

-   Modern SaaS
-   White background
-   Blue primary
-   Slate accents
-   Inspired by GitHub, Vercel, Linear, Stripe, Supabase

# Development Phases

## Phase 1 -- Foundation

-   Project setup
-   Authentication
-   Landing page
-   Dashboard layout
-   Sidebar/Navbar
-   Routing
-   Theme
-   Folder structure
-   Error pages

Deliverable: Working auth + dashboard.

## Phase 2 -- Repository Management

-   GitHub URL import
-   ZIP upload
-   Clone/extract repository
-   Language detection
-   Ignore node_modules, .git, dist, build, coverage
-   Repository metadata
-   Analysis history

## Phase 3 -- Static Analysis

-   ESLint
-   Ruff
-   Semgrep
-   Bandit
-   Security
-   Performance
-   Complexity
-   Duplicate code
-   Structured report

## Phase 4 -- AI Layer

-   AI abstraction layer
-   Qwen3-Coder
-   Chunking
-   Prompt builder
-   Structured JSON
-   Bug detection
-   Security suggestions
-   Refactoring
-   Repository score

## Phase 5 -- AI Generation

-   README
-   API docs
-   Architecture summary
-   Folder explanation
-   Unit tests
-   Developer notes
-   Downloadable reports

## Phase 6 -- Dashboard

-   Repository score
-   Security score
-   Performance score
-   Maintainability
-   Charts
-   Search
-   Filters
-   Export

## Phase 7 -- Advanced

-   Chat with repository
-   GitHub OAuth
-   Pull request review
-   Team workspaces
-   Notifications
-   AI commit messages
-   Admin dashboard

## Database Tables

-   users
-   repositories
-   repository_files
-   analyses
-   analysis_issues
-   ai_reports
-   generated_documentation
-   generated_tests
-   analysis_history
-   settings

## API

-   /api/v1/auth
-   /api/v1/repositories
-   /api/v1/analysis
-   /api/v1/report
-   /api/v1/chat

## AI Workflow

1.  Parse repository
2.  Ignore unnecessary files
3.  Split into chunks
4.  Retrieve relevant context
5.  Build prompt
6.  Generate structured JSON
7.  Store results

## Codex Workflow

For every phase: 1. Explain the goal. 2. Explain the architecture. 3.
List files to create. 4. Implement completely. 5. Explain testing. 6.
Stop and wait for approval.
