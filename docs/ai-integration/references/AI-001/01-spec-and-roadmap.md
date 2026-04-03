# AI-001 Spec And Roadmap Note

## Canonical Spec Source

- Primary source: `docs/ai-integration.md:22-42`

## Normalized Scope

The roadmap defines AI-001 as the “Conference Agent (Cross-role Conversational Operator)” with:

- mode `Workflow`
- roles `Author, Reviewer, Chair`
- trigger `User chat request; optionally event-driven nudges after key state changes`
- inputs spanning role context, route/page context, and conference/submission/review/discussion/notification data
- outputs spanning role-aware answers, guided navigation, and safe action execution through controlled tool calls
- dependencies on a server-side tool layer for authenticated actions, approval gates, and audit logs

Evidence: `docs/ai-integration.md:22-35`

## Roadmap Implementation Note Is Historical

The roadmap’s current AI-001 implementation note still describes a baseline centered on:

- `frontend/app/layout.tsx`
- `frontend/components/chatbot/chat-view.tsx`
- `frontend/app/api/chat/route.ts`
- DOM-oriented tooling via `getPageContext` and `performAction`

That note is now materially behind the shipped implementation. Current code adds:

- a chat-first sidebar shell with transcript folding and recent-history controls in `frontend/components/chatbot/chatbot.tsx:102-633`, `frontend/components/chatbot/chat-transcript.tsx:15-27`, and `frontend/components/chatbot/transcript-view-model.ts:49-186`
- structured navigation tools and sitemap-backed route building in `frontend/lib/chatbot/navigation-executor.ts:26-126`, `frontend/lib/chatbot/navigation-routing.ts:13-67`, and `frontend/lib/chatbot/navigation-sitemap.ts:23-341`
- batched browser actions via `performActions` rather than single-step `performAction` in `frontend/lib/chatbot/action-executor.ts:81-168`
- server-managed tools `query_engine` and `get_skill` in `ai-service/app/services/tool_registry.py:76-154`
- backend-enforced data access through `/api/v1/agent/query` with shared-service-token protection in `ai-service/app/services/query_engine_client.py:15-49`, `backend/internal/middleware/auth.go:69-88`, and `backend/internal/agentquery/resources.go:29-470`

It also no longer makes sense to describe server-backed tools only as future work. Server-backed query and skill retrieval already ship. What remains future-facing is broader mutation tooling, approval-gated business actions, and event-driven automation.

Evidence: `docs/ai-integration.md:42`

## Interpretation For Current Documentation

- Treat the roadmap entry as the intended target scope for AI-001.
- Treat shipped code as the authority for what currently exists.
- Treat the roadmap implementation paragraph as a historical baseline, not a current implementation map.
- Use [`02-live-implementation.md`](./02-live-implementation.md) for the real shipped surface.
- Use the main lifecycle record only with caution until it is refreshed against the post-query-engine chatbot.

See also: [`../../AI-001-conference-agent.md`](../../AI-001-conference-agent.md)
