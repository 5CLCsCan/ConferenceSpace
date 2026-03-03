# Conference AI Service

FastAPI + LangGraph backend for ConferenceSpace AI-001.

## Local Run

1. Install dependencies:
   - `poetry install`
2. Create env:
   - `copy .env.example .env`
3. Run migrations:
   - `poetry run alembic upgrade head`
4. Start service:
   - `poetry run uvicorn app.main:app --reload --port 8090`

## Troubleshooting

- If chat returns `401 invalid or expired token`, verify backend auth is reachable at `BACKEND_API_BASE_URL`.
- If chat returns `503 identity service unavailable`, backend auth endpoint is unreachable.
- If chat returns `503 database unavailable`, PostgreSQL is not reachable from `POSTGRES_DSN`.
- For local debugging without backend auth, set:
  - `ALLOW_DEV_AUTH_BYPASS=true`
  - `DEV_AUTH_USER_ID=1`
  - `DEV_AUTH_USER_EMAIL=dev@local`

## Endpoints

- `POST /api/v1/agent/chat`
- `POST /api/v1/agent/tool-result`
- `GET /api/v1/agent/sessions/{thread_id}/history`
- `DELETE /api/v1/agent/sessions/{thread_id}`
