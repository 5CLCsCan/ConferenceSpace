# AI-001 Live Implementation Note

## Summary

AI-001 is currently implemented as a three-part system:

1. a globally mounted frontend chatbot shell
2. a Next.js proxy layer for chat and session APIs
3. a separate FastAPI AI service with Redis/Postgres persistence

Evidence: `frontend/app/layout.tsx:41-46`, `frontend/app/api/chat/route.ts:74-138`, `ai-service/app/main.py:40-54`

## Key Entry Points

### Frontend Shell

- `frontend/app/layout.tsx:41-46`
  - Mounts `ChatbotProvider` and `Chatbot` in the root layout.
- `frontend/components/chatbot/chatbot.tsx:104-177`
  - Creates drafts, loads session lists, and manages view state.
- `frontend/components/chatbot/chat-view.tsx:245-345`
  - Handles chat transport, tool callbacks, and user message submit flow.

### Frontend API Adapters

- `frontend/app/api/chat/route.ts:74-138`
  - Proxies chat and tool results to `ai-service`, then remaps SSE output to the Vercel AI SDK UI stream format.
- `frontend/app/api/chat/sessions/route.ts:12-38`
  - Proxies session listing.
- `frontend/app/api/chat/sessions/[threadId]/route.ts:14-87`
  - Proxies session history and delete operations.

### Client Tool Implementations

- `frontend/lib/chatbot/page-context.ts:47-51`
  - `capturePageContext()`
- `frontend/lib/chatbot/action-executor.ts:26-42`
  - `executeAction()`

### AI Service

- `ai-service/app/api/routes.py:53-122`
  - `/chat`
- `ai-service/app/api/routes.py:141-195`
  - `/tool-result`
- `ai-service/app/api/routes.py:228-320`
  - session history and delete
- `ai-service/app/services/agent_runtime.py:176-352`
  - model loop and tool emission
- `ai-service/app/services/tool_registry.py:15-37`
  - only two v1 tools are registered

## Current Capability Shape

- Shipped:
  - chat UI
  - session persistence and listing
  - client-side tool execution
  - server-side audit and session persistence
  - tool-result resume flow
- Not yet visible:
  - dedicated role-aware retrieval tools
  - server-side business action tools
  - approval gates
  - broader workflow/event automation

See also: [`../../AI-001-conference-agent.md`](../../AI-001-conference-agent.md)
