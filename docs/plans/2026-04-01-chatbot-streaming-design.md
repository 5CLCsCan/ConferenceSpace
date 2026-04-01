# Chatbot Streaming Design

**Date:** 2026-04-01

**Goal**

Make chatbot replies feel genuinely live:
- assistant text should appear incrementally as the provider streams it
- reasoning should stream live when available
- reasoning remains live-only and is not persisted in history
- reasoning should render as a user-facing collapsible "Thoughts" block, not as a technical tool log

**Root Cause Hypothesis**

The current frontend path already supports AI SDK UI-message streaming for both text and reasoning. The weak point is upstream normalization in `ai-service/app/services/llm_client.py`.

For the configured provider path (`openrouter/google/gemini-2.5-flash-lite` via LiteLLM), streamed reasoning may arrive embedded inside `delta.content` with `<think>...</think>` tags rather than as a structured `reasoning_content` or `thinking` field. If that tagged content is forwarded as plain assistant text:
- reasoning is not surfaced as reasoning
- markdown rendering can effectively hide or defer that content
- the visible answer may appear only after the tag closes or after the stream ends

**Approved Approach**

1. Keep the existing frontend AI SDK UI-message stream contract.
2. Fix source normalization in `ai-service` so streamed chunks are split into:
   - assistant text deltas
   - reasoning deltas
   - tool call deltas
3. Keep reasoning live-only by continuing not to persist reasoning into message history.
4. Replace the current raw reasoning presentation with a user-facing collapsible "Thoughts" block in the transcript UI.

**Data Flow**

1. LiteLLM returns streaming chat deltas.
2. `LLMClient.stream_chat()` normalizes provider-specific delta shapes into internal chunks with explicit `content`, `reasoning`, and `tool_calls`.
3. `AgentRuntime._llm_iteration()` emits:
   - `token` for assistant text
   - `reasoning_start` / `reasoning_token` / `reasoning_end` for live reasoning
   - tool events as before
4. `frontend/app/api/chat/route.ts` converts those internal events into AI SDK UI-message stream events.
5. `useChat()` incrementally updates assistant message parts.
6. Transcript rendering shows:
   - streaming assistant text inline
   - streaming reasoning inside a collapsible "Thoughts" block

**Reasoning Presentation**

- Label: `Thoughts`
- Presentation: inline collapsible block within the assistant turn
- Tone: user-facing, minimal chrome, distinct from tool rows
- Default state: open while reasoning is streaming; collapsible by the user
- Persistence: none

**Testing**

- Backend tests will cover provider chunk normalization, especially `<think>...</think>` split across streamed deltas.
- Frontend tests will cover the "Thoughts" block rendering and transcript behavior for reasoning parts.

