# AI-001 Reference Index

This folder contains curated notes for AI-001 after the 2026 agent-chatbot expansion. The older reference set centered on a smaller DOM-only assistant. The current implementation is broader: transcript-first UI, structured navigation, mixed client/server tools, backend query access, and skill retrieval.

## Reference Notes

- [`01-spec-and-roadmap.md`](./01-spec-and-roadmap.md)
  - Normalized read of the original AI-001 roadmap scope, plus a note on which roadmap implementation comments are now historical.
- [`02-live-implementation.md`](./02-live-implementation.md)
  - Current shipped map of the frontend shell, transcript renderer, AI runtime, tool registry, and backend query engine.
- [`03-existing-related-docs.md`](./03-existing-related-docs.md)
  - Catalog of related documents with explicit guidance on which ones are still useful and which ones are now stale or only partially current.

## Source Files Worth Opening First

- `docs/ai-integration.md:22-42`
  - Original AI-001 scope and dependency statement.
- `frontend/app/layout.tsx:41-52`
  - Global chatbot mount, provider, and navigation mask.
- `frontend/components/chatbot/chatbot.tsx:102-633`
  - Chat-first sidebar shell, recent-history switcher, conversation hydration, and delete/new flows.
- `frontend/components/chatbot/chat-view.tsx:66-155,228-375`
  - `useChat` transport, tool callbacks, submit behavior, and current composer controls.
- `frontend/components/chatbot/transcript-view-model.ts:49-186`
  - Folding raw `UIMessage[]` into assistant/user transcript turns.
- `frontend/app/api/chat/route.ts:10-12,75-121,250-421`
  - Next.js proxy adapter, SSE remap, and server-managed tool handling.
- `ai-service/app/services/prompt.py:5-173`
  - Tool priority order, query-engine rules, page-tool workflow, and skill-index injection.
- `ai-service/app/services/agent_runtime.py:55-132,203-332,376-485`
  - Runtime loop, mixed tool execution, pending-tool persistence, and server-tool dispatch.
- `ai-service/app/services/tool_registry.py:15-154`
  - Six-tool registry: navigation, page context, batched actions, query engine, and skill retrieval.
- `backend/internal/agentquery/resources.go:29-470`
  - Backend query-engine resource catalog and access boundaries.

## Reading Order

1. Start with the current shipped map: [`02-live-implementation.md`](./02-live-implementation.md)
2. Read the original scope note: [`01-spec-and-roadmap.md`](./01-spec-and-roadmap.md)
3. Read supporting and stale-doc guidance: [`03-existing-related-docs.md`](./03-existing-related-docs.md)
4. Read [`../../AI-001-conference-agent.md`](../../AI-001-conference-agent.md) only if you need the older lifecycle verdict. Parts of that record still describe the smaller pre-query-engine implementation.
