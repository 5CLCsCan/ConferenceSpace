# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ConferenceSpace is an AI-powered conference management system for academic conferences. It features intelligent reviewer matching, paper recommendations, conflict of interest detection, and review quality analysis.

**Tech Stack:**
- Frontend: Next.js 15 (App Router), TypeScript, React 18, Tailwind CSS v4, shadcn/ui
- Backend: Go 1.24, Gin framework, PostgreSQL 15, Neo4j 5.15 (graph database)
- AI: OpenRouter API, Gemini API

## Common Commands

### Backend (from `/backend`)
```bash
make dev                 # Start DB + migrations + server (primary dev command)
make server              # Start Go server only
make test                # Run all tests
make test-api            # Run API integration tests
make lint                # Run golangci-lint
make format              # Run go fmt
make swagger             # Generate Swagger docs
make migrate-up          # Run database migrations
make migrate-create NAME=xxx  # Create new migration
make db-reset            # Reset database
make neo4j-up            # Start Neo4j graph database
make install-tools       # Install migrate, swag, golangci-lint
```

### Frontend (from `/frontend`)
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run test             # Run tests with Vitest
npm run test:run         # Run tests once (no watch)
npm run pretty           # Format with Prettier
```

## Architecture

### Backend: Clean Architecture
```
backend/internal/
├── controller/    # HTTP handlers (Presentation layer)
├── service/       # Business logic (Application layer)
├── storage/       # Data persistence (Infrastructure layer)
├── model/         # Domain models & DTOs
├── middleware/    # HTTP middleware (auth, CORS)
├── clients/       # External API clients (AI services)
└── websocket/     # WebSocket handlers
```

Each layer has an aggregator file (`controller.go`, `service.go`, `storage.go`) that holds all dependencies for that layer. Entity implementations live in subfolders.

**Dependency flow:** Storage → Service → Controller (injected in `cmd/server/main.go`)

### Frontend Structure
```
frontend/
├── app/           # Next.js App Router pages
│   ├── api/       # API routes (proxy to backend)
│   ├── dashboard/ # Main dashboard
│   └── (auth)/    # Login/register pages
├── components/    # React components by domain
│   ├── author/    # Author-specific UI
│   ├── chair/     # Chair/PC member UI
│   ├── reviewer/  # Reviewer UI
│   ├── coi/       # Conflict of interest
│   └── ui/        # shadcn/ui base components
├── lib/           # Utilities, API clients, contexts
└── hooks/         # Custom React hooks
```

### Dual Database Architecture
- **PostgreSQL**: Relational data (users, conferences, papers, reviews, assignments)
- **Neo4j**: Graph data for author relationships, co-authorship networks, COI detection

## Adding New Backend Entities

1. Create model in `internal/model/entity/`
2. Create storage in `internal/storage/entity/`
3. Create service in `internal/service/entity/`
4. Create controller in `internal/controller/entity/`
5. Update aggregators (`storage.go`, `service.go`, `controller.go`)
6. Wire dependencies in `cmd/server/main.go`
7. Create migration: `make migrate-create NAME=create_entity_table`

## API Structure

- Base path: `/api/v1/`
- Swagger docs: `/swagger/index.html`
- Health check: `/health`
- Authentication: JWT tokens via middleware

## Environment Setup

Backend (`.env` in `/backend`):
- `SERVER_PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `GEMINI_API_KEY`, `GEMINI_MODEL` for AI features

Frontend (`.env.local` in `/frontend`):
- `NEXT_PUBLIC_API_BASE_URL` - Client-side API URL
- `BACKEND_API_BASE_URL` - Server-side API URL
- `OPENROUTER_API_KEY` - Chatbot functionality

## Frontend Styling Conventions

When creating or modifying frontend components, always reference the styling convention files:
- `frontend/.steerings/insights.md` - Design insights and patterns
- `frontend/.steerings/sizings.md` - Sizing conventions (font sizes, spacing, etc.)

Explore existing components in the platform to understand the styling patterns, then apply similar styling and sizing based on these convention files.

## OpenSpec

This project uses OpenSpec for change proposals. When working on proposals, specs, architecture changes, or breaking changes, reference the OpenSpec documentation.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **ConferenceSpace** (21784 symbols, 40502 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/ConferenceSpace/context` | Codebase overview, check index freshness |
| `gitnexus://repo/ConferenceSpace/clusters` | All functional areas |
| `gitnexus://repo/ConferenceSpace/processes` | All execution flows |
| `gitnexus://repo/ConferenceSpace/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
