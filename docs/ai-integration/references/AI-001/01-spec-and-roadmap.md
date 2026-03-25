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

## Roadmap Implementation Note

The roadmap’s current AI-001 implementation note still describes a baseline centered on:

- `frontend/app/layout.tsx`
- `frontend/components/chatbot/chat-view.tsx`
- `frontend/app/api/chat/route.ts`
- DOM-oriented tooling via `getPageContext` and `performAction`

It also says production-safe state mutations should be added as server-backed tools mapped to typed API clients.

Evidence: `docs/ai-integration.md:42`

## Interpretation For Current Documentation

- Treat the roadmap entry as the intended target scope for AI-001.
- Treat shipped code as the authority for what currently exists.
- Use the main lifecycle record to express the difference between target scope and delivered v1 state.

See also: [`../../AI-001-conference-agent.md`](../../AI-001-conference-agent.md)
