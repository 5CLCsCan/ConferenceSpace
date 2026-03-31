# Chatbot Sidebar Rewrite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the chatbot sidebar as a chat-first transcript UI that groups tool activity into assistant turns and separates user and assistant rendering paths.

**Architecture:** Keep the existing transport and session plumbing, but add a transcript-mapping layer between raw `UIMessage[]` and the renderer. Replace the current two-screen sidebar with a chat-first shell, a slim conversation switcher, and dedicated `UserMessage` and `AssistantTurn` components.

**Tech Stack:** Next.js App Router, React 18, TypeScript, `@ai-sdk/react`, `Streamdown`, Vitest, Testing Library

---

### Task 1: Save the transcript contract in tests

**Files:**
- Create: `frontend/components/chatbot/__tests__/transcript-view-model.test.ts`
- Inspect: `frontend/components/chatbot/chat-view.tsx`

**Step 1: Write the failing test**

Add tests that prove:
- assistant text + inline tool request + tool result => one assistant turn
- persisted `role="tool"` message is folded into the previous assistant turn
- orphaned tool payloads are preserved in a fallback activity group

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- frontend/components/chatbot/__tests__/transcript-view-model.test.ts`

Expected: FAIL because the transcript mapper does not exist yet.

**Step 3: Write minimal implementation**

Create a transcript-mapping utility and supporting types under `frontend/components/chatbot/` or `frontend/lib/chatbot/` with only the logic needed to make the tests pass.

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- frontend/components/chatbot/__tests__/transcript-view-model.test.ts`

Expected: PASS

### Task 2: Lock the user/assistant rendering split

**Files:**
- Create: `frontend/components/chatbot/user-message.tsx`
- Create: `frontend/components/chatbot/assistant-turn.tsx`
- Create: `frontend/components/chatbot/assistant-tool-row.tsx`
- Test: `frontend/components/chatbot/__tests__/chat-transcript.test.tsx`

**Step 1: Write the failing test**

Add rendering tests that prove:
- user text is wrapped in the contained message shell
- assistant markdown renders without that shell
- tool rows render inside the assistant turn

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- frontend/components/chatbot/__tests__/chat-transcript.test.tsx`

Expected: FAIL because the new components and structure do not exist.

**Step 3: Write minimal implementation**

Implement the new rendering components using current typography and color settings, with `Streamdown` for assistant markdown.

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- frontend/components/chatbot/__tests__/chat-transcript.test.tsx`

Expected: PASS

### Task 3: Replace the chat body with a transcript-driven view

**Files:**
- Modify: `frontend/components/chatbot/chat-view.tsx`
- Inspect: `frontend/app/api/chat/route.ts`

**Step 1: Write the failing test**

Extend transcript rendering tests to cover:
- streaming tool state inline
- multiple tool calls in one assistant turn
- reasoning block placement

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- frontend/components/chatbot/__tests__/chat-transcript.test.tsx`

Expected: FAIL for the newly added assertions.

**Step 3: Write minimal implementation**

Refactor `chat-view.tsx` to:
- build transcript turns from raw messages
- render those turns through the new components
- preserve existing transport and composer behavior

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- frontend/components/chatbot/__tests__/chat-transcript.test.tsx`

Expected: PASS

### Task 4: Rebuild the sidebar shell into a chat-first layout

**Files:**
- Modify: `frontend/components/chatbot/chatbot.tsx`
- Inspect: `frontend/components/chatbot/conversation-list.tsx`

**Step 1: Write the failing test**

Add a shell test that proves:
- no conversation-list screen transition remains
- recent conversation switching is available from the header
- current conversation stays primary

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- frontend/components/chatbot/__tests__/chatbot-shell.test.tsx`

Expected: FAIL because the current shell still uses a separate conversation-list screen.

**Step 3: Write minimal implementation**

Refactor the sidebar shell to:
- remove the separate conversation-list view state
- add a slim history control in the header
- keep new conversation and close actions
- preserve resizing behavior unless it conflicts with the new layout

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- frontend/components/chatbot/__tests__/chatbot-shell.test.tsx`

Expected: PASS

### Task 5: Verify behavior and clean up

**Files:**
- Modify: `frontend/components/chatbot/chat-view.tsx`
- Modify: `frontend/components/chatbot/chatbot.tsx`
- Modify: any new chatbot component files created above

**Step 1: Run focused test suite**

Run: `npm run test:run -- frontend/components/chatbot/__tests__/transcript-view-model.test.ts frontend/components/chatbot/__tests__/chat-transcript.test.tsx frontend/components/chatbot/__tests__/chatbot-shell.test.tsx`

Expected: PASS

**Step 2: Run lint or the nearest targeted validation**

Run: `npm run lint`

Expected: no new errors caused by the rewrite

**Step 3: Review git diff**

Run: `git diff -- frontend/components/chatbot frontend/lib/chatbot frontend/app/api/chat/route.ts`

Expected: only chatbot transcript and shell changes
