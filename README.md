# ConferenceSpace

ConferenceSpace is an AI-powered conference management system for academic conferences. It features intelligent reviewer matching, paper recommendations, conflict of interest detection, and review quality analysis.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, React 18, Tailwind CSS v4, shadcn/ui
- **Backend**: Go 1.24, Gin framework, PostgreSQL 15, Neo4j 5.15 (graph database)
- **AI Service**: FastAPI (Python), deterministic agent loop orchestration, OpenRouter/Gemini APIs

## Services

| Service | Path | Default Port | Docs |
|---------|------|---------------|------|
| Backend API | `/backend` | `8080` | [backend/README.md](backend/README.md) |
| Frontend | `/frontend` | `3000` | [frontend/README.md](frontend/README.md) |
| AI Service | `/ai-service` | `8090` | [ai-service/README.md](ai-service/README.md) |

## Quick Start

Run each service from its own directory, in this order:

```bash
# 1. Backend — starts Postgres + Neo4j, runs migrations, starts the API
cd backend
cp .env.example .env
make dev

# 2. AI service — FastAPI service backing the AI/agent features
cd ai-service
poetry install
cp .env.example .env
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --port 8090

# 3. Frontend
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

The frontend will be available at `http://localhost:3000`, the backend API at `http://localhost:8080`, and the AI service at `http://localhost:8090`.

To seed demo data once the backend is running, see [devtool/seeder/README.md](devtool/seeder/README.md).

## Repository Structure

```
ConferenceSpace/
├── backend/       # Go backend (clean architecture: controller/service/storage/model)
├── frontend/      # Next.js frontend
├── ai-service/    # FastAPI AI/agent service
├── deployment/    # Production deployment config (Caddyfile, docker-compose, bootstrap script)
├── devtool/       # Demo data seeders
└── .tests/        # End-to-end / integration test scripts
```

## Testing

- Backend: `make test` (from `/backend`)
- Frontend: `pnpm test:run` (from `/frontend`)
- AI service: `poetry run pytest` (from `/ai-service`)
- End-to-end: see [.tests/test-plan.md](.tests/test-plan.md)
