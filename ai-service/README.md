# Conference AI Service v1

FastAPI-based AI service for ConferenceSpace with deterministic loop orchestration.

## Features

- No LangGraph runtime.
- Versioned API under `/api/v1/agent`.
- Route-level auth by backend token introspection (`/api/v1/users/me`).
- SSE stream with standards-compliant `data:` framing.
- Chat + tool resume flow (`/chat`, `/tool-result`).
- Postgres persistence in schema `ai` (`ai_sessions`, `ai_messages`, `ai_tool_audit`).
- Redis-backed tool-result handoff and rate limits.
- Reasoning is streamed but not persisted.

## Local Run

1. Install dependencies
   - `poetry install`
2. Create env
   - `copy .env.example .env`
3. Run migrations
   - `poetry run alembic upgrade head`
4. Start service
   - `poetry run uvicorn app.main:app --reload --port 8090`

## Endpoints

- `POST /api/v1/agent/chat`
- `POST /api/v1/agent/tool-result`
- `GET /api/v1/agent/sessions`
- `GET /api/v1/agent/sessions/{thread_id}/history`
- `DELETE /api/v1/agent/sessions/{thread_id}`
- `GET /health`
- `GET /ready`
- `GET /metrics`

## Failure Modes

- `401`: invalid or expired token.
- `429`: rate limit exceeded.
- `503`: dependency unavailable (backend auth, Postgres, Redis).

## Notes

- v1 tool surface is client-only: `getPageContext`, `performAction`.
- Memory/attachments/RAG/background workers are intentionally deferred.
- Alembic uses its own version table: `ai_service_alembic_version` (avoids conflict with backend migrations in the same DB).
