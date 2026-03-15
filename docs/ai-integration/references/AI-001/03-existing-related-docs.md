# AI-001 Existing Related Docs

## Purpose

This note catalogs AI-001-related documents that already existed outside `docs/ai-integration/` and explains how to use them safely.

## Documents

### `docs/ai-agent-architecture.md`

- Status: explicitly marked `Draft` (`docs/ai-agent-architecture.md:3`)
- Use: target-state or architecture-direction context
- Caution: it describes a FastAPI + LangGraph target architecture and related target-state components rather than the shipped v1 runtime (`docs/ai-agent-architecture.md:11-17`)

### `chatbot-architecture/*.md`

- Use: supporting architecture notes for the broader chatbot system
- Caution: these are supporting documents, not the canonical AI-001 lifecycle record

### `ai-service/README.md`

- Use: the best short summary of the shipped service shape
- Important current-state signal: it explicitly says `No LangGraph runtime` and identifies the v1 tool surface as client-only, with memory/attachments/RAG/background workers deferred (`ai-service/README.md:7-14`, `ai-service/README.md:46-47`)

## Practical Reading Guidance

- For shipped behavior, trust code and `ai-service/README.md` first.
- For target-state design intent, read `docs/ai-agent-architecture.md` second.
- For subsystem depth, read the `chatbot-architecture/` files last.

See also: [`../../AI-001-conference-agent.md`](../../AI-001-conference-agent.md)
