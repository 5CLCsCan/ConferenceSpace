# AI-001 Reference Index

This folder contains curated notes for AI-001 so an agent can navigate the implementation and related documents without guessing.

## Reference Notes

- [`01-spec-and-roadmap.md`](./01-spec-and-roadmap.md)
  - Normalized read of the AI-001 roadmap entry in `docs/ai-integration.md`.
- [`02-live-implementation.md`](./02-live-implementation.md)
  - Concise map of the shipped implementation and the key source files to inspect first.
- [`03-existing-related-docs.md`](./03-existing-related-docs.md)
  - Catalog of older or supporting AI-001-related docs, including draft-vs-shipped distinctions.

## Original Source Files Worth Opening First

- `docs/ai-integration.md:22-42`
  - Original AI-001 spec and dependency statement.
- `frontend/app/layout.tsx:41-46`
  - Global chatbot mount point.
- `frontend/components/chatbot/chat-view.tsx:245-345`
  - `useChat` flow, tool callbacks, and submit behavior.
- `frontend/app/api/chat/route.ts:74-138`
  - Next.js proxy adapter for AI-001 chat.
- `ai-service/app/api/routes.py:53-195`
  - Service chat and tool-result endpoints.
- `ai-service/app/services/agent_runtime.py:29-586`
  - Runtime loop, prompt, tool emission, and finalization behavior.
- `ai-service/app/services/tool_registry.py:15-37`
  - Current v1 tool surface.
- `ai-service/app/db/models.py:29-114`
  - Durable storage model.

## Reading Order

1. Start with the main lifecycle record: [`../../AI-001-conference-agent.md`](../../AI-001-conference-agent.md)
2. Read the roadmap note: [`01-spec-and-roadmap.md`](./01-spec-and-roadmap.md)
3. Read the live implementation note: [`02-live-implementation.md`](./02-live-implementation.md)
4. Only then read older design material from [`03-existing-related-docs.md`](./03-existing-related-docs.md)
