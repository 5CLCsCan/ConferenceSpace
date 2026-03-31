# AI-006 Chair Decision Copilot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build AI-006 as a persisted, advisory-only evidence synthesis workflow in the existing chair submission `reviews` tab.

**Architecture:** The frontend adds a typed copilot panel above the existing decision controls. The Go backend owns chair authorization, decision-relevant evidence aggregation, fingerprinting, and current-artifact plus run persistence. `ai-service` owns typed artifact generation behind a dedicated `chair-decision-copilot` workflow. V1 remains synchronous with explicit generate/regenerate actions and no auto-run on page load.

**Tech Stack:** Next.js 15, React 18, TypeScript, Vitest, Go 1.24, Gin, FastAPI, SQLAlchemy, Alembic, OpenRouter-backed `LLMClient`.

---

## Implementation Locks

- Keep AI-006 in the existing chair submission `reviews` tab.
- Do not create a new top-level tab or a separate AI workspace.
- Do not allow the workflow to recommend accept/reject or predict acceptance likelihood.
- Do not call `updateSubmissionStatus` from any AI-006 path.
- Do not silently regenerate on page load.
- Persist one current shared artifact per submission and keep all run records for the lifetime of the submission.
- Rebuttal-related fields must resolve to `not_applicable` when rebuttal is disabled or absent.

### Task 1: Add frontend contract tests and typed client surface

**Files:**
- Create: `frontend/lib/api/chair-decision-copilot.ts`
- Create: `frontend/lib/api/__tests__/chair-decision-copilot.test.ts`
- Create: `frontend/hooks/use-chair-decision-copilot.ts`

**Step 1: Write the failing API-client tests**

- Cover `GET /decision-copilot`
- Cover `POST /decision-copilot/generate`
- Cover `POST /decision-copilot/regenerate`
- Cover typed states `idle | generating | ready | stale | failed`

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- frontend/lib/api/__tests__/chair-decision-copilot.test.ts`

**Step 3: Write minimal API client and hook**

- Mirror `frontend/lib/api/reviewer-briefing.ts`
- Keep copilot state isolated from existing review-save hooks

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- frontend/lib/api/__tests__/chair-decision-copilot.test.ts`

**Step 5: Commit**

```bash
git add frontend/lib/api/chair-decision-copilot.ts frontend/lib/api/__tests__/chair-decision-copilot.test.ts frontend/hooks/use-chair-decision-copilot.ts
git commit -m "feat: add chair decision copilot client"
```

### Task 2: Add frontend panel states in the existing reviews tab

**Files:**
- Modify: `frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx`
- Create: `frontend/components/chair/conference-detail/submission-detail/chair-decision-copilot-panel.tsx`
- Create: `frontend/components/chair/conference-detail/submission-detail/__tests__/chair-decision-copilot-panel.test.tsx`

**Step 1: Write the failing panel tests**

- `idle` shows empty state and `Generate recommendation`
- `ready` shows artifact and `Regenerate`
- `stale` shows stale banner without auto-run
- `failed` preserves last artifact when present
- guardrail copy renders in all non-idle states

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- frontend/components/chair/conference-detail/submission-detail/__tests__/chair-decision-copilot-panel.test.tsx`

**Step 3: Implement the panel and mount it above the decision controls**

- Keep it visually separate from the accept/reject form
- Keep existing decision controls unchanged

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- frontend/components/chair/conference-detail/submission-detail/__tests__/chair-decision-copilot-panel.test.tsx`

**Step 5: Commit**

```bash
git add frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx frontend/components/chair/conference-detail/submission-detail/chair-decision-copilot-panel.tsx frontend/components/chair/conference-detail/submission-detail/__tests__/chair-decision-copilot-panel.test.tsx
git commit -m "feat: add chair decision copilot panel"
```

### Task 3: Add backend DTOs and submission-scoped controller routes

**Files:**
- Modify: `backend/internal/dto/submission.go`
- Create: `backend/internal/controller/submission/decision_copilot.go`
- Create: `backend/internal/controller/submission/decision_copilot_test.go`
- Modify: `backend/internal/controller/submission/submission.go`
- Modify: `backend/internal/controller/controller.go`
- Modify: `backend/cmd/server/main.go`

**Step 1: Write the failing backend controller tests**

- authorized chair can `GET`, `generate`, and `regenerate`
- `GET` never generates
- unauthorized actor is denied
- failed rerun preserves current artifact

**Step 2: Run test to verify it fails**

Run: `cd backend; go test ./internal/controller/submission -run DecisionCopilot`

**Step 3: Implement DTOs and controller handlers**

- `GetDecisionCopilot`
- `GenerateDecisionCopilot`
- `RegenerateDecisionCopilot`

**Step 4: Run test to verify it passes**

Run: `cd backend; go test ./internal/controller/submission -run DecisionCopilot`

**Step 5: Commit**

```bash
git add backend/internal/dto/submission.go backend/internal/controller/submission/decision_copilot.go backend/internal/controller/submission/decision_copilot_test.go backend/internal/controller/submission/submission.go backend/internal/controller/controller.go backend/cmd/server/main.go
git commit -m "feat: add submission decision copilot routes"
```

### Task 4: Implement backend evidence aggregation, fingerprinting, and ai-service client calls

**Files:**
- Modify: `backend/internal/clients/ai_service/client.go`
- Create: `backend/tests/api/submission/decision_copilot_test.go`
- Modify: `backend/internal/controller/submission/decision_copilot.go`

**Step 1: Write failing API-level tests**

- stale fingerprint after review change
- stale fingerprint after discussion change
- rebuttal-disabled returns `not_applicable`
- `generate` may reuse current artifact when fingerprint matches
- `regenerate` always creates a new run

**Step 2: Run test to verify it fails**

Run: `cd backend; go test ./tests/api/submission -run DecisionCopilot`

**Step 3: Implement evidence aggregation and internal workflow client**

- normalize review payloads and analytics
- normalize discussion signals
- conditionally include rebuttal signals
- compute fingerprint from decision-relevant evidence plus schema version

**Step 4: Run test to verify it passes**

Run: `cd backend; go test ./tests/api/submission -run DecisionCopilot`

**Step 5: Commit**

```bash
git add backend/internal/clients/ai_service/client.go backend/internal/controller/submission/decision_copilot.go backend/tests/api/submission/decision_copilot_test.go
git commit -m "feat: add decision copilot evidence aggregation"
```

### Task 5: Add ai-service workflow, schemas, and persistence

**Files:**
- Modify: `ai-service/app/main.py`
- Modify: `ai-service/app/db/models.py`
- Create: `ai-service/app/repositories/decision_copilot_repo.py`
- Create: `ai-service/app/workflows/chair_decision_copilot/__init__.py`
- Create: `ai-service/app/workflows/chair_decision_copilot/router.py`
- Create: `ai-service/app/workflows/chair_decision_copilot/runner.py`
- Create: `ai-service/app/workflows/chair_decision_copilot/prompts.py`
- Create: `ai-service/app/workflows/chair_decision_copilot/schemas.py`
- Create: `ai-service/tests/test_decision_copilot_models.py`
- Create: `ai-service/tests/test_decision_copilot_runner.py`
- Create: `ai-service/tests/test_decision_copilot_routes.py`

**Step 1: Write failing ai-service tests**

- schema rejects verdict-like output
- `lookup` returns `idle` with no artifact
- `generate` returns typed artifact
- `regenerate` creates a new run
- failed rerun preserves prior current artifact
- rebuttal-disabled resolves `not_applicable`

**Step 2: Run test to verify it fails**

Run: `cd ai-service; pytest tests/test_decision_copilot_models.py tests/test_decision_copilot_runner.py tests/test_decision_copilot_routes.py -q`

**Step 3: Implement workflow and persistence**

- create current artifact and run persistence
- add internal resolve route
- enforce typed evidence-only artifact sections

**Step 4: Run test to verify it passes**

Run: `cd ai-service; pytest tests/test_decision_copilot_models.py tests/test_decision_copilot_runner.py tests/test_decision_copilot_routes.py -q`

**Step 5: Commit**

```bash
git add ai-service/app/main.py ai-service/app/db/models.py ai-service/app/repositories/decision_copilot_repo.py ai-service/app/workflows/chair_decision_copilot ai-service/tests/test_decision_copilot_models.py ai-service/tests/test_decision_copilot_runner.py ai-service/tests/test_decision_copilot_routes.py
git commit -m "feat: add chair decision copilot workflow"
```

### Task 6: Add end-to-end verification and lifecycle docs

**Files:**
- Modify: `docs/ai-integration.md`
- Create or Modify: `docs/ai-integration/AI-006-chair-decision-copilot.md`
- Create or Modify: `docs/ai-integration/references/AI-006/00-index.md`

**Step 1: Run frontend verification**

Run: `cd frontend; npm run test:run -- frontend/lib/api/__tests__/chair-decision-copilot.test.ts frontend/components/chair/conference-detail/submission-detail/__tests__/chair-decision-copilot-panel.test.tsx`

**Step 2: Run backend verification**

Run: `cd backend; go test ./internal/controller/submission ./tests/api/submission`

**Step 3: Run ai-service verification**

Run: `cd ai-service; pytest tests/test_decision_copilot_models.py tests/test_decision_copilot_runner.py tests/test_decision_copilot_routes.py -q`

**Step 4: Update lifecycle docs**

- add AI-006 canonical lifecycle record
- correct roadmap wording from recommendation framing to evidence-first advisory framing

**Step 5: Commit**

```bash
git add docs/ai-integration.md docs/ai-integration/AI-006-chair-decision-copilot.md docs/ai-integration/references/AI-006/00-index.md
git commit -m "docs: record chair decision copilot lifecycle"
```
