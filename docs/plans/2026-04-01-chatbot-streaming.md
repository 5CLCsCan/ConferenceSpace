# Chatbot Streaming Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make chatbot replies stream incrementally, including live-only reasoning rendered in a user-facing Thoughts block.

**Architecture:** Fix streaming at the ai-service normalization layer so provider-specific deltas become explicit assistant text and reasoning events, then keep the existing frontend UI-message stream path and refine reasoning presentation in the assistant transcript. Avoid fake streaming and avoid persisting reasoning into conversation history.

**Tech Stack:** FastAPI, Python 3.11, LiteLLM, Next.js 15, React 18, AI SDK UI, Vitest, pytest

---

### Task 1: Backend Streaming Normalization

**Files:**
- Modify: `ai-service/app/services/llm_client.py`
- Test: `ai-service/tests/test_llm_client.py`

**Step 1: Write failing backend tests**

Add tests for:
- plain content deltas stream as assistant text
- explicit reasoning fields stream as reasoning
- `<think>...</think>` content streams are split into reasoning and visible answer text
- `<think>` / `</think>` tags split across chunk boundaries are handled correctly

**Step 2: Run backend tests to verify failure**

Run: `poetry run pytest tests/test_llm_client.py -q`

**Step 3: Implement minimal normalization changes**

Add a small stateful parser in `llm_client.py` that:
- preserves existing explicit reasoning extraction
- falls back to parsing `<think>...</think>` from streamed content when no explicit reasoning field is present
- yields normalized `content` and `reasoning` deltas without leaking `<think>` tags into visible assistant text

**Step 4: Run backend tests to verify pass**

Run: `poetry run pytest tests/test_llm_client.py -q`

### Task 2: Frontend Thoughts Presentation

**Files:**
- Modify: `frontend/components/chatbot/assistant-turn.tsx`
- Modify: `frontend/components/chatbot/__tests__/chat-transcript.test.tsx`

**Step 1: Write failing frontend tests**

Add assertions that reasoning parts render in a user-facing collapsible block labeled `Thoughts`, distinct from tool rows.

**Step 2: Run frontend tests to verify failure**

Run: `pnpm test:run components/chatbot/__tests__/chat-transcript.test.tsx`

**Step 3: Implement minimal UI update**

Change the reasoning renderer to:
- use a friendlier heading (`Thoughts`)
- keep it inline with assistant content
- use collapsible presentation that is visually separate from tool streaming rows

**Step 4: Run frontend tests to verify pass**

Run: `pnpm test:run components/chatbot/__tests__/chat-transcript.test.tsx`

### Task 3: End-to-End Chatbot Streaming Regression

**Files:**
- Modify: `frontend/components/chatbot/__tests__/chatbot-shell.test.tsx` only if needed
- Verify: `frontend/components/chatbot/chat-view.tsx`
- Verify: `frontend/app/api/chat/route.ts`

**Step 1: Add or adjust regression coverage if gaps remain**

Only add test coverage if the existing chatbot shell tests do not adequately cover incremental rendering assumptions.

**Step 2: Run chatbot test slice**

Run: `pnpm test:run components/chatbot/__tests__`

**Step 3: Run backend + frontend targeted verification**

Run:
- `poetry run pytest tests/test_llm_client.py -q`
- `pnpm test:run components/chatbot/__tests__`

**Step 4: Review scope**

Run: `git diff -- ai-service/app/services/llm_client.py ai-service/tests/test_llm_client.py frontend/components/chatbot/assistant-turn.tsx frontend/components/chatbot/__tests__/chat-transcript.test.tsx`

