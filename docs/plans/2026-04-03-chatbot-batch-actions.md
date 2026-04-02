# Chatbot Batch Actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single-step `performAction` page tool with a list-based `performActions` tool that executes same-page UI actions sequentially and aborts on failure or stale DOM refs.

**Architecture:** Keep the batch executor on the frontend, where the DOM ref map and element liveness checks exist. Update the ai-service tool schema, prompt contract, and input normalization to advertise the new list-based tool while the frontend reuses the existing single-action handlers inside a stricter sequential executor.

**Tech Stack:** Python 3.11+, FastAPI ai-service, TypeScript, React 18, Next.js App Router, Vitest, Testing Library, pytest

---

### Task 1: Lock the ai-service tool contract for `performActions`

**Files:**
- Modify: `ai-service/tests/test_api_schemas.py`
- Modify: `ai-service/app/services/tool_registry.py`
- Inspect: `docs/plans/2026-04-03-chatbot-batch-actions-design.md`

**Step 1: Write the failing test**

Add assertions that prove:
- `performActions` exists in `TOOL_REGISTRY`
- `performAction` no longer exists
- `performActions` is a client tool
- the schema requires `actions`
- each action item requires `action`
- action items allow only `action`, `ref`, `text`, `key`, and `value`

**Step 2: Run test to verify it fails**

Run from `ai-service`: `poetry run pytest tests/test_api_schemas.py -q`

Expected: FAIL because the registry still exposes `performAction`.

**Step 3: Write minimal implementation**

Update `ai-service/app/services/tool_registry.py` to:
- remove `performAction`
- add `performActions`
- define an `actions` array schema with per-step item validation

Do not add optional batch control flags.

**Step 4: Run test to verify it passes**

Run from `ai-service`: `poetry run pytest tests/test_api_schemas.py -q`

Expected: PASS

### Task 2: Lock input normalization and prompt expectations in ai-service

**Files:**
- Modify: `ai-service/tests/test_agent_tools.py`
- Modify: `ai-service/tests/test_agent_runtime_helpers.py`
- Modify: `ai-service/app/services/agent_tools.py`
- Modify: `ai-service/app/services/prompt.py`

**Step 1: Write the failing tests**

Add tests that prove:
- `pick_tool_call()` unwraps `properties.actions` into canonical `performActions` input
- valid `performActions` input is preserved
- the system prompt references `performActions`
- the page workflow says batching is same-page only
- the prompt tells the model to re-read page context after failed or stale batches

**Step 2: Run test to verify they fail**

Run from `ai-service`: `poetry run pytest tests/test_agent_tools.py tests/test_agent_runtime_helpers.py -q`

Expected: FAIL because normalization and prompt text still target `performAction`.

**Step 3: Write minimal implementation**

Update `ai-service/app/services/agent_tools.py` to normalize:
- `performActions`
- `properties.actions`

Update `ai-service/app/services/prompt.py` so the page workflow says:
- `getPageContext` before `performActions`
- batch only confirmed same-page refs
- abort on failure or DOM invalidation
- re-run `getPageContext` after failed or stale batches

Keep the prompt as a single readable triple-quoted string literal.

**Step 4: Run test to verify they pass**

Run from `ai-service`: `poetry run pytest tests/test_agent_tools.py tests/test_agent_runtime_helpers.py -q`

Expected: PASS

### Task 3: Lock the frontend batch executor behavior with failing tests

**Files:**
- Modify: `frontend/lib/chatbot/__tests__/action-executor.test.ts`
- Modify: `frontend/lib/chatbot/action-executor.ts`

**Step 1: Write the failing tests**

Add tests that prove:
- `normalizeActionInvocation()` still unwraps nested single-step properties used internally by per-step helpers
- a new `normalizeBatchActionInvocation()` unwraps malformed `properties.actions`
- `executeActions()` completes a simple `clear -> type` sequence
- `executeActions()` aborts on the first failing step
- `executeActions()` aborts when a later step targets a disconnected element
- the returned payload includes `success`, `completedCount`, `results`, and `abortedAt` when aborted

Use real DOM elements in jsdom rather than mocking every handler.

**Step 2: Run test to verify they fail**

Run from `frontend`: `npm run test:run -- lib/chatbot/__tests__/action-executor.test.ts`

Expected: FAIL because the batch executor does not exist yet.

**Step 3: Write minimal implementation**

Update `frontend/lib/chatbot/action-executor.ts` to:
- keep the existing per-action handlers
- add batch input and result types
- add a batch normalization helper
- add `executeActions(refMap, input)`
- validate per-step refs before execution
- fail hard when the next referenced element is missing or disconnected
- aggregate per-step results into a batch result

Do not build a retry loop or conditional DSL.

**Step 4: Run test to verify it passes**

Run from `frontend`: `npm run test:run -- lib/chatbot/__tests__/action-executor.test.ts`

Expected: PASS

### Task 4: Wire `performActions` into the chat client

**Files:**
- Modify: `frontend/components/chatbot/__tests__/chat-view-navigation-tools.test.tsx`
- Modify: `frontend/components/chatbot/__tests__/transcript-view-model.test.ts`
- Modify: `frontend/components/chatbot/chat-view.tsx`
- Modify: `frontend/components/chatbot/assistant-tool-row.tsx`

**Step 1: Write the failing tests**

Add assertions that prove:
- `ChatView` handles a `performActions` tool call
- `ChatView` sends aggregated batch output through `addToolOutput`
- tool labels render `Perform Actions`
- transcript/tool view logic accepts `tool-performActions`

Keep the tests focused on renamed tool behavior, not unrelated navigation features.

**Step 2: Run test to verify they fail**

Run from `frontend`: `npm run test:run -- components/chatbot/__tests__/chat-view-navigation-tools.test.tsx components/chatbot/__tests__/transcript-view-model.test.ts`

Expected: FAIL because the UI still expects `performAction`.

**Step 3: Write minimal implementation**

Update `frontend/components/chatbot/chat-view.tsx` to:
- route `performActions` tool calls
- call `executeActions()`
- return structured batch results

Update `frontend/components/chatbot/assistant-tool-row.tsx` and any transcript helpers so the renamed tool displays correctly.

**Step 4: Run test to verify they pass**

Run from `frontend`: `npm run test:run -- components/chatbot/__tests__/chat-view-navigation-tools.test.tsx components/chatbot/__tests__/transcript-view-model.test.ts`

Expected: PASS

### Task 5: Run focused verification across ai-service and frontend

**Files:**
- Modify: only files above as needed for cleanup

**Step 1: Run backend verification**

Run from `ai-service`: `poetry run pytest tests/test_api_schemas.py tests/test_agent_tools.py tests/test_agent_runtime_helpers.py -q`

Expected: PASS

**Step 2: Run frontend verification**

Run from `frontend`: `npm run test:run -- lib/chatbot/__tests__/action-executor.test.ts components/chatbot/__tests__/chat-view-navigation-tools.test.tsx components/chatbot/__tests__/transcript-view-model.test.ts`

Expected: PASS

**Step 3: Review the change scope**

Run from repo root: `git diff -- docs/plans/2026-04-03-chatbot-batch-actions-design.md docs/plans/2026-04-03-chatbot-batch-actions.md ai-service/app/services/tool_registry.py ai-service/app/services/agent_tools.py ai-service/app/services/prompt.py ai-service/tests/test_api_schemas.py ai-service/tests/test_agent_tools.py ai-service/tests/test_agent_runtime_helpers.py frontend/lib/chatbot/action-executor.ts frontend/lib/chatbot/__tests__/action-executor.test.ts frontend/components/chatbot/chat-view.tsx frontend/components/chatbot/assistant-tool-row.tsx frontend/components/chatbot/__tests__/chat-view-navigation-tools.test.tsx frontend/components/chatbot/__tests__/transcript-view-model.test.ts`

Expected: only the batch-action contract, executor, prompt, and test updates appear.

### Task 6: Commit the implementation in focused slices

**Files:**
- Stage only files touched for each completed task

**Step 1: Commit ai-service contract changes**

Run from repo root:
- `git add ai-service/app/services/tool_registry.py ai-service/app/services/agent_tools.py ai-service/app/services/prompt.py ai-service/tests/test_api_schemas.py ai-service/tests/test_agent_tools.py ai-service/tests/test_agent_runtime_helpers.py`
- `git commit -m "feat: replace performAction with performActions"`

Expected: a commit containing only ai-service contract and test changes.

**Step 2: Commit frontend batch execution changes**

Run from repo root:
- `git add frontend/lib/chatbot/action-executor.ts frontend/lib/chatbot/__tests__/action-executor.test.ts frontend/components/chatbot/chat-view.tsx frontend/components/chatbot/assistant-tool-row.tsx frontend/components/chatbot/__tests__/chat-view-navigation-tools.test.tsx frontend/components/chatbot/__tests__/transcript-view-model.test.ts`
- `git commit -m "feat: add batched chatbot page actions"`

Expected: a commit containing only frontend execution and UI wiring changes.
