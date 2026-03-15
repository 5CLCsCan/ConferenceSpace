# AI-001 Conference Agent

## Overview

- Roadmap entry: [`docs/ai-integration.md`](../ai-integration.md)
- Canonical procedure: [`docs/ai-integration/procedure.md`](./procedure.md)
- Curated references:
  - [`references/AI-001/00-index.md`](./references/AI-001/00-index.md)
  - [`references/AI-001/01-spec-and-roadmap.md`](./references/AI-001/01-spec-and-roadmap.md)
  - [`references/AI-001/02-live-implementation.md`](./references/AI-001/02-live-implementation.md)
  - [`references/AI-001/03-existing-related-docs.md`](./references/AI-001/03-existing-related-docs.md)
- Last reviewed: 2026-03-14

## Verdict

- Verdict: `partial`
- Rationale: AI-001 has a shipped end-to-end v1 foundation with frontend chat UI, Next.js proxy adapters, a FastAPI service, Redis/Postgres-backed session state, tool-result resume flow, and audit persistence, but it does not yet satisfy the full roadmap promise of a cross-role conversational operator with role-aware data access, server-backed authenticated action tools, approval gates, and richer backend integrations (`docs/ai-integration.md:22-42`, `frontend/app/layout.tsx:41-46`, `frontend/app/api/chat/route.ts:74-138`, `ai-service/app/api/routes.py:53-122`, `ai-service/app/db/models.py:29-114`).
- Scope note: Current-state claims in this document are based on shipped code and current service docs, not on older draft architecture targets (`ai-service/README.md:7-14`, `docs/ai-agent-architecture.md:3-17`).

## Lifecycle Status

| State       | Status      | Notes / Linked Artifact                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `create`    | complete    | This lifecycle record and curated reference set establish the canonical AI-001 record.                                                                                                                                                                                                                                                                                                                                                                       |
| `research`  | complete    | Roadmap scope and code surfaces are normalized in [`01-spec-and-roadmap.md`](./references/AI-001/01-spec-and-roadmap.md) and [`02-live-implementation.md`](./references/AI-001/02-live-implementation.md).                                                                                                                                                                                                                                                   |
| `design`    | partial     | Related design material exists, but it is partly draft or target-state oriented rather than a strict record of shipped behavior (`docs/ai-agent-architecture.md:3-17`, `chatbot-architecture/`).                                                                                                                                                                                                                                                             |
| `plan`      | partial     | Architecture and support notes exist, but no single earlier AI-001 lifecycle plan file was serving as the canonical record before this document. Inference: the plan layer was fragmented across draft docs and service notes.                                                                                                                                                                                                                               |
| `implement` | complete    | Frontend shell, proxy routes, DOM tools, FastAPI runtime, migrations, and tests are present in code (`frontend/app/layout.tsx:41-46`, `frontend/components/chatbot/chat-view.tsx:245-345`, `ai-service/app/main.py:40-54`, `ai-service/alembic/versions/20260303_0001_create_ai_schema.py:23-94`, `ai-service/alembic/versions/20260304_0002_conversation_title_and_listing.py:21-34`).                                                                      |
| `verify`    | partial     | Helper, repository, schema, and focused frontend tests exist, but there is no evidence here of a broad end-to-end AI-001 verification suite (`ai-service/tests/test_agent_runtime_helpers.py:6-70`, `ai-service/tests/test_api_schemas.py:9-28`, `ai-service/tests/test_message_repo.py:47-81`, `ai-service/tests/test_routes_helpers.py:9-36`, `ai-service/tests/test_session_repo.py:61-98`, `frontend/lib/chatbot/__tests__/page-context.test.ts:11-37`). |
| `finalize`  | partial     | The record is stable enough for a current verdict, but the verdict is `partial` because roadmap-critical capabilities remain incomplete.                                                                                                                                                                                                                                                                                                                     |
| `supersede` | not started | No newer canonical AI-001 lifecycle record exists.                                                                                                                                                                                                                                                                                                                                                                                                           |

## Artifact Index

| Artifact Type         | Artifact                                                                                                                                       | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roadmap / Spec        | [`docs/ai-integration.md`](../ai-integration.md)                                                                                               | Defines the original AI-001 scope and dependencies (`docs/ai-integration.md:22-42`).                                                                                                                                                                                                                                                                                                                                            |
| Design / Architecture | [`docs/ai-agent-architecture.md`](../ai-agent-architecture.md)                                                                                 | Draft target-state architecture for a later AI-001 shape; useful context, not authoritative for current shipped state (`docs/ai-agent-architecture.md:3-17`).                                                                                                                                                                                                                                                                   |
| Design / Architecture | `chatbot-architecture/*.md`                                                                                                                    | Supporting architecture notes for the chatbot system.                                                                                                                                                                                                                                                                                                                                                                           |
| Service Notes         | [`ai-service/README.md`](../../ai-service/README.md)                                                                                           | Describes the shipped v1 service model, including the explicit “No LangGraph runtime” statement (`ai-service/README.md:7-14`, `ai-service/README.md:46-47`).                                                                                                                                                                                                                                                                    |
| Implementation        | `frontend/app/layout.tsx`                                                                                                                      | Shows the chatbot is globally mounted within the app shell (`frontend/app/layout.tsx:41-46`).                                                                                                                                                                                                                                                                                                                                   |
| Implementation        | `frontend/components/chatbot/*`                                                                                                                | Chat UI, conversation list, local draft handling, and tool callback flow (`frontend/components/chatbot/chatbot.tsx:104-177`, `frontend/components/chatbot/chat-view.tsx:245-345`).                                                                                                                                                                                                                                              |
| Implementation        | `frontend/app/api/chat/*`                                                                                                                      | Next.js proxy layer for chat streaming, tool-result submission, and session history/delete (`frontend/app/api/chat/route.ts:74-138`, `frontend/app/api/chat/sessions/route.ts:12-38`, `frontend/app/api/chat/sessions/[threadId]/route.ts:14-87`).                                                                                                                                                                              |
| Implementation        | `frontend/lib/chatbot/*`                                                                                                                       | DOM context capture and client-side action execution for the only shipped tools (`frontend/lib/chatbot/page-context.ts:42-51`, `frontend/lib/chatbot/action-executor.ts:26-42`).                                                                                                                                                                                                                                                |
| Implementation        | `ai-service/app/*`                                                                                                                             | FastAPI service startup, auth, routes, runtime, persistence, and rate limits (`ai-service/app/main.py:40-54`, `ai-service/app/api/routes.py:53-122`, `ai-service/app/services/agent_runtime.py:29-586`).                                                                                                                                                                                                                        |
| Migrations            | `ai-service/alembic/versions/20260303_0001_create_ai_schema.py`, `ai-service/alembic/versions/20260304_0002_conversation_title_and_listing.py` | Establishes AI schema, message/audit tables, conversation titles, and listing indexes (`ai-service/alembic/versions/20260303_0001_create_ai_schema.py:23-94`, `ai-service/alembic/versions/20260304_0002_conversation_title_and_listing.py:21-34`, `ai-service/alembic/versions/20260304_0002_conversation_title_and_listing.py:76-86`).                                                                                        |
| Verification          | `ai-service/tests/*`, `frontend/lib/chatbot/__tests__/page-context.test.ts`                                                                    | Shows the current test coverage focuses on helpers, schemas, repositories, and page-context exclusion behavior (`ai-service/tests/test_agent_runtime_helpers.py:6-70`, `ai-service/tests/test_api_schemas.py:9-28`, `ai-service/tests/test_message_repo.py:47-81`, `ai-service/tests/test_routes_helpers.py:9-36`, `ai-service/tests/test_session_repo.py:61-98`, `frontend/lib/chatbot/__tests__/page-context.test.ts:11-37`). |
| References            | [`references/AI-001/00-index.md`](./references/AI-001/00-index.md)                                                                             | Entry point for curated reference navigation.                                                                                                                                                                                                                                                                                                                                                                                   |

## Architecture / Data Flow

### App Shell and Chat Surface

The chatbot is mounted globally inside the main frontend layout through `ChatbotProvider` and `Chatbot`, so the assistant is available across role workspaces rather than only on one page (`frontend/app/layout.tsx:41-46`). The chat shell manages a conversation list, local draft creation, remote history fetch, and delete flow in `frontend/components/chatbot/chatbot.tsx`, with route-level hiding on auth and landing pages (`frontend/components/chatbot/chatbot.tsx:104-177`, `frontend/components/chatbot/chatbot.tsx:189-243`, `frontend/components/chatbot/chatbot.tsx:335-459`).

### Chat Turn Flow

`ChatView` uses `useChat` with `DefaultChatTransport` against `/api/chat`, auto-resubmits when assistant tool calls complete, and executes only two tool names inside `onToolCall`: `getPageContext` and `performAction` (`frontend/components/chatbot/chat-view.tsx:245-267`). User message submission currently sends only `{ text: input }`, while attachments are tracked only in local component state and cleared after submit (`frontend/components/chatbot/chat-view.tsx:237-245`, `frontend/components/chatbot/chat-view.tsx:323-345`).

The Next.js `/api/chat` route acts as a proxy adapter to `ai-service`, first detecting completed tool outputs in the message list, posting those results to `/api/v1/agent/tool-result`, then opening the main `/api/v1/agent/chat` SSE stream and remapping internal event types into the Vercel AI SDK UI stream protocol (`frontend/app/api/chat/route.ts:74-115`, `frontend/app/api/chat/route.ts:131-289`, `frontend/app/api/chat/route.ts:353-405`).

### DOM Tool Layer

`capturePageContext()` builds an accessibility-style tree from `document.body`, excludes chatbot-owned UI and explicitly ignored nodes, assigns refs to interactive elements, and returns both the tree and a ref map for later action execution (`frontend/lib/chatbot/page-context.ts:42-51`, `frontend/lib/chatbot/page-context.ts:59-109`, `frontend/lib/chatbot/page-context.ts:255`). `executeAction()` implements the only shipped action surface: `click`, `type`, `press`, `select`, and `clear`, with verification logic for typed and selected values where possible (`frontend/lib/chatbot/action-executor.ts:26-42`, `frontend/lib/chatbot/action-executor.ts:87-257`, `frontend/lib/chatbot/action-executor.ts:289-338`).

### Service Runtime

The FastAPI service is assembled in `ai-service/app/main.py` with Redis, the backend identity provider, runtime store, LiteLLM client, metrics store, and `AgentRuntime`, and it refuses startup without `OPENROUTER_API_KEY` (`ai-service/app/main.py:40-54`, `ai-service/app/main.py:89-96`). The public AI-001 API surface is implemented in `ai-service/app/api/routes.py`: `/chat`, `/tool-result`, session listing, session history, session delete, readiness checks, metrics, message validation, pending-tool enforcement, and rate-limit enforcement (`ai-service/app/api/routes.py:53-122`, `ai-service/app/api/routes.py:141-195`, `ai-service/app/api/routes.py:228-320`, `ai-service/app/api/routes.py:341-417`).

The core runtime in `AgentRuntime` persists unseen messages, resumes pending tool calls from Redis or from the UI message history, streams LLM output and reasoning deltas, emits tool requests, writes tool audit rows, and finalizes sessions with optional rolling-summary compaction (`ai-service/app/services/agent_runtime.py:36-128`, `ai-service/app/services/agent_runtime.py:130-174`, `ai-service/app/services/agent_runtime.py:176-352`, `ai-service/app/services/agent_runtime.py:353-487`, `ai-service/app/services/compaction.py:7-32`).

### Persistence and Session State

The service stores durable session, message, and tool audit records in PostgreSQL tables `ai_sessions`, `ai_messages`, and `ai_tool_audit` (`ai-service/app/db/models.py:29-114`). Redis is used for tool-result handoff and per-minute rate limiting through `RuntimeStore` (`ai-service/app/repositories/runtime_store.py:20-52`). The first migration creates the AI schema tables, and the second adds conversation titles, listing indexes, and thread-level message-id uniqueness for session browsing (`ai-service/alembic/versions/20260303_0001_create_ai_schema.py:23-94`, `ai-service/alembic/versions/20260304_0002_conversation_title_and_listing.py:21-34`, `ai-service/alembic/versions/20260304_0002_conversation_title_and_listing.py:76-86`).

## Interfaces / Tools / Dependencies

### Endpoints

- Frontend adapter endpoints:
  - `/api/chat` (`frontend/app/api/chat/route.ts:74-138`)
  - `/api/chat/sessions` (`frontend/app/api/chat/sessions/route.ts:12-38`)
  - `/api/chat/sessions/{threadId}` (`frontend/app/api/chat/sessions/[threadId]/route.ts:14-87`)
- AI service endpoints:
  - `POST /api/v1/agent/chat` (`ai-service/app/api/routes.py:53`)
  - `POST /api/v1/agent/tool-result` (`ai-service/app/api/routes.py:141`)
  - `GET /api/v1/agent/sessions` (`ai-service/app/api/routes.py:198`)
  - `GET /api/v1/agent/sessions/{thread_id}/history` (`ai-service/app/api/routes.py:228`)
  - `DELETE /api/v1/agent/sessions/{thread_id}` (`ai-service/app/api/routes.py:264`)

### Tool Inventory

- `getPageContext`
  - Declared in the service tool registry as a client-side tool (`ai-service/app/services/tool_registry.py:15-20`)
  - Implemented in the browser via `capturePageContext()` (`frontend/lib/chatbot/page-context.ts:47-51`)
- `performAction`
  - Declared in the service tool registry with a narrow JSON schema for `click`, `type`, `press`, `select`, and `clear` (`ai-service/app/services/tool_registry.py:22-37`)
  - Implemented in the browser via `executeAction()` (`frontend/lib/chatbot/action-executor.ts:26-42`)

### Dependencies

- Model/runtime stack:
  - `litellm`, `fastapi`, `redis`, and `alembic` are explicit service dependencies (`ai-service/pyproject.toml:4`, `ai-service/pyproject.toml:11`, `ai-service/pyproject.toml:20-22`)
  - Service README describes the runtime as “Conference AI Service v1” and explicitly states “No LangGraph runtime” (`ai-service/README.md:1-14`)
- Auth:
  - `IdentityProvider` validates bearer tokens against `GET /api/v1/users/me` and caches the resolved user id/email briefly in memory (`ai-service/app/core/auth.py:31-70`)

## Delivered vs Partial vs Missing vs Deviations

### Delivered

- A globally available chatbot UI is mounted in the frontend shell, not just on a single page (`frontend/app/layout.tsx:41-46`).
- Conversations have durable server-side sessions, titles, history loading, and deletion through the session proxy/service endpoints (`frontend/lib/chatbot/conversations.ts:33-104`, `frontend/app/api/chat/sessions/route.ts:12-38`, `frontend/app/api/chat/sessions/[threadId]/route.ts:14-87`, `ai-service/app/api/routes.py:198-320`).
- Chat turns support tool-request pause and resume via tool-result submission and SSE remapping into the Vercel AI SDK protocol (`frontend/app/api/chat/route.ts:74-138`, `ai-service/app/api/routes.py:53-122`, `ai-service/app/api/routes.py:141-195`).
- Tool audit persistence exists through `ai_tool_audit`, requested/completed audit writes, and durable session/message storage (`ai-service/app/db/models.py:84-114`, `ai-service/app/repositories/tool_audit_repo.py:22-61`, `ai-service/app/repositories/message_repo.py:39-81`, `ai-service/app/repositories/session_repo.py:30-98`).

### Partial

- “Safe action execution through controlled tool calls” is only partially delivered. Tool use is constrained to a registry and audited, but both shipped tools are still browser/client tools rather than authenticated backend business actions (`docs/ai-integration.md:28-35`, `ai-service/app/services/tool_registry.py:15-37`, `ai-service/README.md:46-47`).
- Cross-role availability exists at the shell level, but role-aware operating context is not explicitly injected into the runtime prompt or tool surface. The runtime prompt is generic and does not mention author/reviewer/chair distinctions (`docs/ai-integration.md:28-35`, `frontend/app/layout.tsx:41-46`, `ai-service/app/services/agent_runtime.py:530-546`).
- Verification exists, but the visible test suite is mostly helper/repository/schema focused rather than a comprehensive AI-001 end-to-end suite (`ai-service/tests/test_agent_runtime_helpers.py:6-70`, `ai-service/tests/test_api_schemas.py:9-28`, `ai-service/tests/test_routes_helpers.py:9-36`, `ai-service/tests/test_session_repo.py:61-98`, `frontend/lib/chatbot/__tests__/page-context.test.ts:11-37`).

### Missing

- The roadmap dependency on “server-side tool layer for authenticated actions + approval gates + audit logs” is not fully met. Audit logs are present, but there is no shipped approval gate or backend action-tool layer beyond the client DOM tools (`docs/ai-integration.md:35`, `ai-service/app/services/tool_registry.py:15-37`, `ai-service/README.md:46-47`).
- The roadmap input set references conference, submission, review, discussion, and notification data, but the current service does not expose dedicated retrieval tools or typed API client integrations for those sources (`docs/ai-integration.md:28-35`, `ai-service/app/services/tool_registry.py:15-37`).
- Event-driven nudges after state changes are not visible in the shipped codebase. Inference: no background worker or trigger-driven AI-001 pipeline is present in current AI service or frontend integration (`docs/ai-integration.md:28`, `ai-service/README.md:47`).

### Deviations

- The roadmap still describes a “current baseline” rooted in frontend-only files, but the shipped implementation now includes a separate FastAPI service and Next.js proxy adapter (`docs/ai-integration.md:42`, `frontend/app/api/chat/route.ts:74-138`, `ai-service/app/main.py:40-54`).
- The draft architecture document targets FastAPI plus LangGraph, Redis checkpointing, and a richer target architecture, while the shipped v1 service explicitly states “No LangGraph runtime” and implements a custom deterministic runtime loop instead (`docs/ai-agent-architecture.md:3-17`, `ai-service/README.md:7-14`, `ai-service/app/services/agent_runtime.py:29-487`).

## Risks / Follow-ups

- The system prompt is generic. It identifies “ConferenceSpace assistant” and the two tool rules, but it does not encode role-specific behavior, conference policy context, or richer product constraints (`ai-service/app/services/agent_runtime.py:530-546`).
- `request_metadata` is accepted by the API schema and forwarded by the Next.js adapter, but there is no visible current consumer in the AI service runtime. Inference: route/path metadata is captured for future use more than present reasoning behavior (`frontend/app/api/chat/route.ts:98-115`, `ai-service/app/api/schemas.py:23-34`).
- Attachments and chat mode selection are currently UI-only. Attachments are stored in component state but not included in `sendMessage`, and the `agentic` / `standard` selector does not alter the backend request shape (`frontend/components/chatbot/chat-view.tsx:237-245`, `frontend/components/chatbot/chat-view.tsx:323-345`, `frontend/components/chatbot/chat-view.tsx:743-755`).
- Tool execution remains client-side DOM automation, so current “safe action” guarantees are limited by browser context fidelity and the absence of server-side business actions (`frontend/lib/chatbot/page-context.ts:47-51`, `frontend/lib/chatbot/action-executor.ts:26-42`, `ai-service/README.md:46-47`).
- Reasoning is streamed to the UI but is not persisted as durable history, which may reduce later auditability of model decision traces (`ai-service/README.md:14`).

## Evidence Map

| Source                                              | What It Proves                                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `docs/ai-integration.md:22-42`                      | Original AI-001 scope, intended inputs/outputs, and dependency expectations.                          |
| `frontend/app/layout.tsx:41-46`                     | The chatbot is mounted globally in the frontend shell.                                                |
| `frontend/components/chatbot/chatbot.tsx:104-177`   | Conversation drafts, visibility rules, and current conversation management exist in the UI shell.     |
| `frontend/components/chatbot/chat-view.tsx:245-345` | `useChat`, tool callbacks, attachment state, and submit behavior are implemented.                     |
| `frontend/app/api/chat/route.ts:74-138`             | The frontend adapter proxies tool results and chat requests to `ai-service` and remaps stream events. |
| `frontend/lib/chatbot/page-context.ts:42-51`        | `getPageContext` is a client-side DOM tree capture tool.                                              |
| `frontend/lib/chatbot/action-executor.ts:26-42`     | `performAction` is a client-side DOM action tool.                                                     |
| `ai-service/app/main.py:40-54`                      | The AI service boots with Redis, auth, runtime store, LiteLLM, and `AgentRuntime`.                    |
| `ai-service/app/api/routes.py:53-122`               | Chat streaming and request validation are implemented server-side.                                    |
| `ai-service/app/api/routes.py:141-195`              | Tool-result submission and pending-tool enforcement are implemented server-side.                      |
| `ai-service/app/services/agent_runtime.py:176-352`  | The runtime constructs model messages, streams content, and emits tool requests.                      |
| `ai-service/app/services/tool_registry.py:15-37`    | Only two client-side tools are registered in v1.                                                      |
| `ai-service/app/db/models.py:29-114`                | Durable sessions, messages, and tool audit persistence exist.                                         |
| `ai-service/README.md:7-14`                         | Shipped v1 service explicitly differs from the LangGraph target architecture.                         |
