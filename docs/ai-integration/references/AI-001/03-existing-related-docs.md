# AI-001 Existing Related Docs

## Purpose

This note catalogs AI-001-related documents that already existed outside `docs/ai-integration/` and explains how to use them safely.

## Documents

### `docs/ai-agent-architecture.md`

- Status: explicitly marked `Draft` (`docs/ai-agent-architecture.md:3`)
- Use: target-state or architecture-direction context
- Caution: it describes a FastAPI + LangGraph target architecture and related target-state components rather than the shipped v1 runtime (`docs/ai-agent-architecture.md:11-17`)

### `docs/plans/2026-04-01-chatbot-sidebar-rewrite-design.md`

- Status: recent frontend design note for the current sidebar/transcript rewrite
- Use: best supporting doc for why the sidebar became chat-first and why tool activity is folded into assistant turns
- Caution: it is frontend-focused and does not describe the server-managed `query_engine` / `get_skill` additions or the backend query surface

### `docs/plans/2026-04-01-chatbot-sidebar-rewrite.md`

- Status: implementation plan for the sidebar rewrite
- Use: useful for locating the transcript-view-model, assistant/user rendering split, and shell rewrite test coverage
- Caution: it is a plan artifact, not the canonical current-state record

### `chatbot-architecture/*.md`

- Use: supporting architecture notes for the broader chatbot system
- Caution: these are supporting documents, not the canonical AI-001 lifecycle record

### `ai-service/README.md`

- Use: still useful for service boot, endpoints, dependency shape, and the explicit `No LangGraph runtime` statement
- Caution: its tool-surface note is now stale. It still describes the runtime as client-tool-only, but shipped code now includes server-managed `query_engine` and `get_skill` tools (`ai-service/README.md:7-14`, `ai-service/app/services/tool_registry.py:76-154`)

### `docs/ai-integration/AI-001-conference-agent.md`

- Status: canonical lifecycle record, but not yet refreshed for the post-query-engine chatbot expansion
- Use: previous verdict and lifecycle framing
- Caution: parts of its implementation map still describe the smaller pre-navigation, pre-query-engine surface and should not override the live implementation note in this folder

## Practical Reading Guidance

- For shipped behavior, trust code and [`02-live-implementation.md`](./02-live-implementation.md) first.
- For the original roadmap target, read [`01-spec-and-roadmap.md`](./01-spec-and-roadmap.md) second.
- For frontend rewrite intent, read the 2026-04-01 sidebar design docs third.
- For target-state architecture direction, read `docs/ai-agent-architecture.md` after that.
- Use `ai-service/README.md` for setup and endpoint quick reference, not as the final source of truth on the current tool surface.
- Read `chatbot-architecture/` files last for subsystem depth only.

See also: [`../../AI-001-conference-agent.md`](../../AI-001-conference-agent.md)
