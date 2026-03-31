# AI-003 Reviewer Pre-Read Briefing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver AI-003 end-to-end through the existing reviewer sidebar card as a neutral submission pre-read that actually ingests the manuscript content.

**Architecture:** The frontend keeps the current reviewer submission-detail placement and adds a dedicated briefing API client plus hook. The Go backend owns reviewer authorization, assignment ownership, and reviewer-safe manuscript loading. `ai-service` owns manuscript extraction, source normalization, structured generation, cache lookup, and persistence. V1 stays `synchronous + cache`.

**Tech Stack:** Next.js 15, React 18, TypeScript, Vitest, Go 1.24, Gin, FastAPI, SQLAlchemy, Alembic, OpenRouter-backed `LLMClient`.

## Status

- State: complete
- Last updated: 2026-03-31
- Outcome: the plan was executed end-to-end and AI-003 is now shipped as a reviewer-triggered submission-only pre-read workflow.

---

## Implementation Locks

- Keep the existing UI placement in `frontend/components/reviewer/submission-review/review-sidebar.tsx`.
- Keep browser-facing routes assignment-scoped:
  - `GET /api/v1/conferences/{conference_id}/assignments/{assignment_id}/briefing`
  - `POST /api/v1/conferences/{conference_id}/assignments/{assignment_id}/briefing/generate`
- Keep the internal workflow as a single synchronous resolve endpoint:
  - `POST /api/v1/workflows/reviewer-pre-read-briefing/resolve`
- Do not add persisted `queued | running` states in v1.
- Do not include discussion, rebuttal, or precheck in the AI-003 source contract.
- Do not use abstract-only input. Manuscript ingestion is required.
- Do not rely on `submission_version`; the backend does not have that field.
- Do not route AI-003 through the existing generic submission file controller without stronger reviewer assignment checks.
- The artifact must stay descriptive:
  - no recommendation
  - no score prediction
  - no publication-likelihood framing
  - no raw markdown as the canonical stored artifact

## Batch 1: Rewrite `ai-service` tests around the corrected contract

**Files:**
- Modify: `ai-service/tests/test_reviewer_briefing_models.py`
- Modify: `ai-service/tests/test_reviewer_briefing_runner.py`
- Modify: `ai-service/tests/test_reviewer_briefing_routes.py`
- Modify: `ai-service/tests/test_reviewer_briefing_prompts.py`

**Steps:**

1. Remove discussion, rebuttal, and fake `submission_version` assumptions from the tests.
2. Rewrite the request contract tests so AI-003 is submission-only.
3. Add route or runner tests for manuscript-backed generation:
   - `lookup` returns `idle` when no artifact exists
   - `generate` requires manuscript-backed input
   - cache hit returns `ready` without a second generation
   - stale detection is based on submission-state markers or normalized source hash, not `submission_version`
4. Add tests proving the artifact stays neutral:
   - no recommendation language
   - no predicted score
   - no discussion or rebuttal sections
5. Add tests proving extraction failure or low-coverage manuscript input is surfaced explicitly.

## Batch 2: Correct `ai-service` AI-003 workflow and persistence

**Files:**
- Modify: `ai-service/app/main.py`
- Modify: `ai-service/app/db/models.py`
- Modify: `ai-service/alembic/versions/20260330_0004_reviewer_briefing_tables.py`
- Modify: `ai-service/app/repositories/reviewer_briefing_repo.py`
- Modify: `ai-service/app/workflows/reviewer_pre_read_briefing/schemas.py`
- Modify: `ai-service/app/workflows/reviewer_pre_read_briefing/router.py`
- Modify: `ai-service/app/workflows/reviewer_pre_read_briefing/runner.py`
- Modify: `ai-service/app/workflows/reviewer_pre_read_briefing/prompts.py`

**Steps:**

1. Replace the current abstract-plus-discussion or rebuttal request shape with a submission-only shape.
2. Reuse or factor the existing submission-gating extraction path so AI-003 can parse manuscript files in `ai-service`.
3. Update the artifact schema to a neutral submission pre-read shape:
   - `submission_snapshot`
   - `claimed_contributions`
   - `notable_elements`
   - `reviewer_attention_points`
   - `stated_scope_and_limitations`
   - `guardrails`
4. Remove `discussion_context`, `rebuttal_context`, and `submission_version` from the corrected workflow contract.
5. Replace any persistence fields that rely on fake version semantics with a real submission-state marker or normalized source hash.
6. Keep the current resolve pattern and terminal states:
   - `idle`
   - `ready`
   - `stale`
   - `failed`
7. Reuse native structured output with local schema validation as already required.

## Batch 3: Fix backend authorization and manuscript loading

**Files:**
- Modify: `backend/internal/controller/assignment/briefing_test.go`
- Modify: `backend/tests/api/assignment/briefing_test.go`
- Create or Modify: `backend/internal/controller/assignment/briefing.go`
- Modify: `backend/internal/controller/controller.go`
- Modify: `backend/internal/clients/ai_service/client.go`
- Modify: `backend/internal/dto/assignment.go`
- Modify: `backend/cmd/server/main.go`

**Steps:**

1. Rewrite backend tests to reflect the corrected submission-only contract.
2. Add or correct assignment briefing handlers:
   - `GetReviewerBriefing`
   - `GenerateReviewerBriefing`
3. Verify reviewer assignment ownership before any manuscript access.
4. Load the stored manuscript file from backend storage after authorization succeeds.
5. Do not use `submission.GetFile` as the AI-003 access boundary unless it is first hardened to the same assignment-ownership standard.
6. Extend the `ai-service` client with a manuscript-backed resolve request. Reuse the existing multipart upload pattern from submission gating if that gives the cleanest path.
7. Compute a real submission-state marker from current reviewer-visible submission state rather than from fictional version fields.

## Batch 4: Replace the mock frontend card with typed briefing UI

**Files:**
- Create: `frontend/lib/api/assignment-briefings.ts`
- Create: `frontend/hooks/use-assignment-briefing.ts`
- Modify: `frontend/components/reviewer/submission-review/review-sidebar.tsx`
- Modify: `frontend/components/reviewer/submission-review.tsx`

**Steps:**

1. Remove the prompt textarea and prompt-based dialog behavior from `AIAssistantCard`.
2. Add a dedicated briefing API module for `GET` and `POST` assignment briefing calls.
3. Add `useAssignmentBriefing()` and keep its lifecycle separate from `use-assignment-review.ts`.
4. Render fixed typed states:
   - `idle`
   - `generating`
   - `ready`
   - `stale`
   - `failed`
5. Render only typed artifact sections. Do not depend on markdown parsing as the canonical contract.
6. Keep the existing page placement and footprint.

## Batch 5: Verification And Cleanup

**Required checks:**

- `ai-service` tests prove AI-003 no longer depends on discussion, rebuttal, or `submission_version`.
- `ai-service` tests prove manuscript extraction or manuscript-backed input is required.
- backend tests prove non-owner reviewer and author cannot read or generate the briefing.
- backend tests prove stale detection follows real submission-state changes.
- frontend tests prove the mock prompt UI is gone and typed sections are rendered.
- manual smoke test confirms the artifact never contains recommendations or predicted scores.

**Smoke scenarios:**

- reviewer opens an assignment with no artifact and sees `Start generating`
- first generation reads the manuscript and returns a typed neutral briefing
- second generation hits cache when submission state has not changed
- changing the manuscript or submission metadata marks the old artifact `stale`
- a non-owner reviewer cannot read or generate the artifact

## Documentation Alignment

Before claiming completion, confirm the AI-003 docs all agree on:

- submission-only input
- actual manuscript ingestion
- no discussion or rebuttal input
- no `submission_version` fiction
- reviewer-safe manuscript access in Go
- synchronous generation with cache
