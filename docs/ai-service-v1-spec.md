# AI Service v1 Specification

## Scope

This specification is the implementation source of truth for AI service v1.

Included:
- Chat loop orchestration
- Route-level authn/authz
- Session/message/tool-audit persistence
- Tool resume flow (`/tool-result`)
- SSE streaming and adapter compatibility

Deferred to v2+:
- Long-term memory
- Attachments and file ingestion
- RAG/vector indexing
- Background workers
- Server write tools

## API Contract

Base path: `/api/v1/agent`

### `POST /chat`

Request:
- `thread_id: string`
- `messages: UIMessage[]`
- `trigger?: "submit-message" | "regenerate-message"`
- `message_id?: string`
- `request_metadata?: { client?: string; path?: string; user_agent?: string }`

Internal stream events:
- `start`
- `reasoning_start`
- `reasoning_token`
- `reasoning_end`
- `tool_start`
- `tool_end`
- `token`
- `done`
- `error`

### `POST /tool-result`

Request:
- `thread_id: string`
- `tool_call_id: string`
- `result: { tool_name: string; status: "output-available" | "output-error" | "timeout"; output?: any; error_text?: string }`

### `GET /sessions?limit=<int>&cursor=<opaque>`
Returns paginated session summaries for the authenticated user (newest first by `last_activity_at`, then `thread_id`).

### `GET /sessions/{thread_id}/history`
Returns session metadata and persisted messages (`session_meta.title` + per-message `createdAt` included).

### `DELETE /sessions/{thread_id}`
Deletes session runtime and persisted session artifacts.

## Adapter Mapping (`frontend/app/api/chat/route.ts`)

AI service internal event -> AI SDK UI message stream events:
- `start` -> `start`, `start-step`
- `token` -> `text-start` (once), `text-delta`
- `reasoning_start` -> `reasoning-start`
- `reasoning_token` -> `reasoning-delta`
- `reasoning_end` -> `reasoning-end`
- `tool_start` -> `tool-input-start`, `tool-input-available`
- `tool_end(status=output-available)` -> `tool-output-available`
- `tool_end(status=output-error|timeout)` -> `tool-output-error`
- `done` -> `text-end` (if active), `finish-step`, `finish`
- `error` -> `error`

## Security and Reliability

- Every route validates bearer token via backend `/api/v1/users/me`.
- Every thread-scoped route enforces owner check (`user_id`).
- Dependency degradation returns `503` with clear reason.
- Request and result paths use Redis-backed per-user rate limits.
- Reasoning is streamed to users but not persisted in DB.

## Persistence (Postgres schema `ai`)

- `ai.ai_sessions`
- `ai.ai_messages`
- `ai.ai_tool_audit`

Indexes include:
- Session last activity and status
- Session listing index by user and recency (`user_id`, `last_activity_at`, `thread_id`)
- Message thread chronology and idempotency (`(thread_id, message_id)`)
- Tool audit idempotency by `(thread_id, tool_call_id)`

## Runtime Limits

- Iteration cap: `MAX_ITERATIONS`
- Tool timeout: `TOOL_RESULT_TIMEOUT_SECONDS`
- Max messages and message text size per request

## Tool Surface v1

Allowed tool names:
- `getPageContext`
- `performAction`

Execution mode:
- Client-side only (tool execution done by frontend, results returned via `/tool-result`).
