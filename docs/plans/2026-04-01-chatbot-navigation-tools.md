# Chatbot Navigation Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add sitemap-backed `getCurrentNavigation` and `navigate` client tools so the chatbot can understand its current route and move reliably within authenticated platform pages.

**Architecture:** Keep route awareness on the frontend, where Next pathname, URL state, and client navigation exist. Expose a typed sitemap registry plus route resolution/build helpers in `frontend/lib/chatbot`, then wire two new client tools through `ChatView` and advertise them through the Python tool registry and runtime instructions.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Next navigation, Python 3.12, ai-service tool registry/runtime helpers, Vitest, Testing Library, pytest

---

### Task 1: Lock the sitemap contract in frontend tests

**Files:**
- Create: `frontend/lib/chatbot/__tests__/navigation-sitemap.test.ts`
- Create: `frontend/lib/chatbot/navigation-sitemap.ts`
- Inspect: `frontend/lib/routes.ts`
- Inspect: `frontend/lib/navigation.ts`
- Inspect: `docs/plans/2026-04-01-chatbot-navigation-tools-design.md`

**Step 1: Write the failing test**

Add tests that prove:
- the authenticated sitemap includes the approved shared, author, reviewer, and chair destination ids
- dynamic destinations declare the correct required and optional params
- `chair.templates.index` is not present
- each destination has stable metadata: `id`, `label`, `roleScope`, `pathTemplate`, `kind`

**Step 2: Run test to verify it fails**

Run: `pnpm test:run lib/chatbot/__tests__/navigation-sitemap.test.ts`

Expected: FAIL because the sitemap module does not exist yet.

**Step 3: Write minimal implementation**

Create `frontend/lib/chatbot/navigation-sitemap.ts` with:
- `NavigationDestination`
- `NavigationSitemap`
- a curated `CHATBOT_NAVIGATION_SITEMAP`
- helper exports for lookup by destination id

Do not add inference or scanning logic. Hardcode the approved registry from the design doc.

**Step 4: Run test to verify it passes**

Run: `pnpm test:run lib/chatbot/__tests__/navigation-sitemap.test.ts`

Expected: PASS

### Task 2: Add route resolution and URL building helpers

**Files:**
- Create: `frontend/lib/chatbot/__tests__/navigation-routing.test.ts`
- Create: `frontend/lib/chatbot/navigation-routing.ts`
- Inspect: `frontend/lib/chatbot/navigation-sitemap.ts`

**Step 1: Write the failing test**

Add tests that prove:
- a pathname like `/role/chair/conferences/123/submissions/456` resolves to `chair.submission.detail`
- query params are extracted only when declared for the destination
- unmapped paths return `destinationId: null` and `matchStatus: "unmapped"`
- URL building fills required params into the path
- missing required params throw or return a structured failure

Use representative cases:
- `author.submission.new?conferenceId=abc`
- `reviewer.assignment.detail?conferenceId=abc&tab=review`
- `profile.detail`

**Step 2: Run test to verify it fails**

Run: `pnpm test:run lib/chatbot/__tests__/navigation-routing.test.ts`

Expected: FAIL because the routing helpers do not exist yet.

**Step 3: Write minimal implementation**

Create `frontend/lib/chatbot/navigation-routing.ts` with:
- `resolveCurrentNavigation()`
- `buildNavigationPath()`
- path-template matching and param extraction helpers
- explicit validation for required params

Keep the implementation deterministic. Do not add heuristic fallback to parent routes.

**Step 4: Run test to verify it passes**

Run: `pnpm test:run lib/chatbot/__tests__/navigation-routing.test.ts`

Expected: PASS

### Task 3: Add client-side navigation execution helpers

**Files:**
- Create: `frontend/lib/chatbot/__tests__/navigation-executor.test.ts`
- Create: `frontend/lib/chatbot/navigation-executor.ts`
- Modify: `frontend/lib/chatbot/action-executor.ts` only if shared result typing meaningfully reduces duplication

**Step 1: Write the failing test**

Add tests that prove:
- `getCurrentNavigation` returns `url`, `pathname`, `destinationId`, `params`, `matchStatus`, and `sitemap`
- `navigate` succeeds for a valid destination id and params
- `navigate` fails for unknown destination ids
- `navigate` fails for missing required params
- `navigate` fails for destinations outside the current role scope

Mock router push and current URL inputs rather than rendering a full page shell.

**Step 2: Run test to verify it fails**

Run: `pnpm test:run lib/chatbot/__tests__/navigation-executor.test.ts`

Expected: FAIL because the executor does not exist yet.

**Step 3: Write minimal implementation**

Create `frontend/lib/chatbot/navigation-executor.ts` with:
- typed inputs and outputs for both new tools
- `getCurrentNavigationSnapshot(...)`
- `navigateToDestination(...)`
- role-scope validation
- structured success/failure payloads

Do not mix this into `action-executor.ts` unless there is a genuinely shared utility worth extracting.

**Step 4: Run test to verify it passes**

Run: `pnpm test:run lib/chatbot/__tests__/navigation-executor.test.ts`

Expected: PASS

### Task 4: Wire the new tools into `ChatView`

**Files:**
- Modify: `frontend/components/chatbot/chat-view.tsx`
- Test: `frontend/components/chatbot/__tests__/chat-transcript.test.tsx`
- Test: `frontend/components/chatbot/__tests__/chatbot-shell.test.tsx`
- Inspect: `frontend/components/chatbot/assistant-tool-row.tsx`

**Step 1: Write the failing test**

Add tests that prove:
- when the tool name is `getCurrentNavigation`, `ChatView` returns a navigation snapshot
- when the tool name is `navigate`, `ChatView` executes client navigation and returns a structured tool result
- tool failures surface as tool errors or failed outputs instead of throwing

Prefer focused `ChatView` behavior tests. If existing transcript or shell tests are the closest fit, extend them narrowly.

**Step 2: Run test to verify it fails**

Run: `pnpm test:run components/chatbot/__tests__`

Expected: FAIL for the new navigation-tool assertions.

**Step 3: Write minimal implementation**

Update `frontend/components/chatbot/chat-view.tsx` to:
- capture current pathname and router access
- execute `getCurrentNavigation`
- execute `navigate`
- keep `getPageContext` and `performAction` behavior unchanged

If needed, update `assistant-tool-row.tsx` to add user-facing labels:
- `Get Current Navigation`
- `Navigate`

**Step 4: Run test to verify it passes**

Run: `pnpm test:run components/chatbot/__tests__`

Expected: PASS

### Task 5: Add the new tool specs to the ai-service registry

**Files:**
- Modify: `ai-service/app/services/tool_registry.py`
- Test: `ai-service/tests/test_api_schemas.py`

**Step 1: Write the failing test**

Add schema tests that prove:
- `getCurrentNavigation` is registered as a client tool with an empty object schema
- `navigate` is registered as a client tool with `destinationId` required and `params` optional

**Step 2: Run test to verify it fails**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_api_schemas.py -q`

Expected: FAIL because the tool specs are not registered yet.

**Step 3: Write minimal implementation**

Update `ai-service/app/services/tool_registry.py` to add:
- `getCurrentNavigation`
- `navigate`

Keep schema names and field names aligned with the frontend executor.

**Step 4: Run test to verify it passes**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_api_schemas.py -q`

Expected: PASS

### Task 6: Update runtime helper expectations and agent instructions

**Files:**
- Modify: `ai-service/app/services/agent_runtime.py`
- Test: `ai-service/tests/test_agent_runtime_helpers.py`

**Step 1: Write the failing test**

Add tests that prove:
- tool registry exposure includes the new tools in the runtime-facing tool list
- runtime instructions mention using `getCurrentNavigation` and `navigate` before page interactions when route changes are needed

**Step 2: Run test to verify it fails**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_agent_runtime_helpers.py -q`

Expected: FAIL because the runtime still only instructs the model about `getPageContext` and `performAction`.

**Step 3: Write minimal implementation**

Update `ai-service/app/services/agent_runtime.py` to:
- include the new tools in the advertised tool surface
- revise `_system_prompt()` to recommend:
  - `getCurrentNavigation` for route awareness
  - `navigate` for route changes
  - `getPageContext` and `performAction` after arriving on the destination page

Do not add server-side sitemap logic. The Python runtime should remain contract-focused only.

**Step 4: Run test to verify it passes**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_agent_runtime_helpers.py -q`

Expected: PASS

### Task 7: Run focused verification across frontend and ai-service

**Files:**
- Modify: only files introduced above as needed for cleanup

**Step 1: Run frontend navigation tests**

Run: `pnpm test:run lib/chatbot/__tests__/navigation-sitemap.test.ts lib/chatbot/__tests__/navigation-routing.test.ts lib/chatbot/__tests__/navigation-executor.test.ts components/chatbot/__tests__`

Expected: PASS

**Step 2: Run backend navigation/tool tests**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_api_schemas.py tests/test_agent_runtime_helpers.py -q`

Expected: PASS

**Step 3: Review the diff**

Run: `git diff -- docs/plans/2026-04-01-chatbot-navigation-tools-design.md docs/plans/2026-04-01-chatbot-navigation-tools.md frontend/lib/chatbot frontend/components/chatbot/chat-view.tsx frontend/components/chatbot/assistant-tool-row.tsx ai-service/app/services/tool_registry.py ai-service/app/services/agent_runtime.py ai-service/tests/test_api_schemas.py ai-service/tests/test_agent_runtime_helpers.py`

Expected: only the new navigation-tool contract, sitemap helpers, client execution, and test coverage changes
