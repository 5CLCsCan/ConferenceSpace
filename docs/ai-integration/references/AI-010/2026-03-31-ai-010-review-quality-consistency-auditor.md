# AI-010 Review Quality and Consistency Auditor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build AI-010 as a reviewer-facing AI semantic audit workflow that evaluates the current review payload, supports dismissible warnings, enforces only justified blocking findings on submit, and logs reviewer-confirmed submit overrides when audit enforcement fails.

**Architecture:** The frontend sends the current review payload to a dedicated backend audit route for `draft_save` and `submit_preflight` after local form validation. The Go backend owns assignment auth, dismissal state, submit enforcement, and override logging, and revalidates request integrity before invoking `ai-service`. `ai-service` owns the typed AI-driven semantic audit workflow and run history. AI-003 is optional additional coverage context only.

**Tech Stack:** Next.js 15, React 18, TypeScript, Vitest, Go 1.24, Gin, PostgreSQL 15, FastAPI, Pydantic, SQLAlchemy, Alembic

---

### Task 1: Backend Schema for Audit State and Events

**Files:**
- Create: `backend/migrations/000039_add_review_audit_state_and_events.up.sql`
- Create: `backend/migrations/000039_add_review_audit_state_and_events.down.sql`
- Modify: `backend/internal/model/assignment.go`

**Step 1: Write the migration**

- Add `review_audit_state JSONB NOT NULL DEFAULT '{}'::jsonb` to `paper_assignments`.
- Create `review_audit_events` with:
  - `id BIGSERIAL PRIMARY KEY`
  - `conference_id BIGINT NOT NULL`
  - `assignment_id BIGINT NOT NULL`
  - `actor_id BIGINT NOT NULL`
  - `event_type TEXT NOT NULL`
  - `audit_mode TEXT NULL`
  - `workflow_run_id TEXT NULL`
  - `payload_json JSONB NOT NULL DEFAULT '{}'::jsonb`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

**Step 2: Update the assignment model**

- Add `ReviewAuditState json.RawMessage \`db:"review_audit_state"\`` to the assignment model.
- Do not merge audit state into `ReviewData`.

**Step 3: Verify migration syntax**

Run: `make migrate-up`
Expected: migration applies without SQL errors.

**Step 4: Commit**

```bash
git add backend/migrations/000039_add_review_audit_state_and_events.* backend/internal/model/assignment.go
git commit -m "feat: add review audit state schema"
```

### Task 2: Backend DTOs and Storage for Dismissals and Audit Events

**Files:**
- Modify: `backend/internal/dto/assignment.go`
- Modify: `backend/internal/storage/assignment/assignment.go`
- Create: `backend/internal/model/review_audit.go`
- Create: `backend/internal/storage/review_audit/review_audit.go`

**Step 1: Add DTOs**

- Add DTOs for:
  - `ReviewAuditRequest`
  - `ReviewAuditResponse`
  - `ReviewAuditFinding`
  - `ReviewAuditDismissalRequest`

**Step 2: Add storage types**

- Create a typed model for dismissal state:
  - `dismissed_warnings: [{code, condition_fingerprint, dismissed_at}]`
- Create storage methods to:
  - get assignment audit state
  - upsert dismissal
  - remove dismissal
  - append event rows

**Step 3: Update assignment reads**

- Ensure assignment fetch paths load `review_audit_state`.
- Keep `review_data` unmarshalling unchanged.

**Step 4: Add storage-focused tests if the repo already has coverage for assignment storage**

Run: `go test ./internal/storage/...`
Expected: storage package tests pass.

**Step 5: Commit**

```bash
git add backend/internal/dto/assignment.go backend/internal/model/review_audit.go backend/internal/storage/assignment/assignment.go backend/internal/storage/review_audit/review_audit.go
git commit -m "feat: add review audit storage and dto types"
```

### Task 3: AI-Service Contract and Semantic Workflow Tests

**Files:**
- Create: `ai-service/tests/test_review_quality_auditor_models.py`
- Create: `ai-service/tests/test_review_quality_auditor_runner.py`
- Create: `ai-service/tests/test_review_quality_auditor_routes.py`
- Create: `ai-service/tests/test_review_quality_auditor_prompts.py`

**Step 1: Write failing schema tests**

- Validate request modes:
  - `draft_save`
  - `submit_preflight`
  - `submit_enforcement`
- Validate finding shape:
  - `code`
  - `severity`
  - `field`
  - `message`
  - `suggestion`
  - `condition_fingerprint`

**Step 2: Write failing runner tests**

- semantic contradiction between narrative and recommendation produces finding
- weak justification for strong judgment produces finding
- AI-003 absent still returns non-coverage findings
- AI-003 present adds optional coverage findings
- recommendation-steering language is rejected

**Step 3: Write failing route tests**

- invalid payload returns 422
- valid request returns typed response
- failed run persists failure record

**Step 4: Run tests to verify they fail for missing implementation**

Run: `pytest ai-service/tests/test_review_quality_auditor_models.py ai-service/tests/test_review_quality_auditor_runner.py ai-service/tests/test_review_quality_auditor_routes.py -q`
Expected: failures for missing workflow modules.

**Step 5: Commit**

```bash
git add ai-service/tests/test_review_quality_auditor_*.py
git commit -m "test: add review quality auditor workflow tests"
```

### Task 4: AI-Service Workflow Implementation

**Files:**
- Modify: `ai-service/app/main.py`
- Modify: `ai-service/app/db/models.py`
- Create: `ai-service/alembic/versions/20260331_0005_review_quality_audit_runs.py`
- Create: `ai-service/app/repositories/review_quality_audit_repo.py`
- Create: `ai-service/app/workflows/review_quality_auditor/schemas.py`
- Create: `ai-service/app/workflows/review_quality_auditor/router.py`
- Create: `ai-service/app/workflows/review_quality_auditor/runner.py`
- Create: `ai-service/app/workflows/review_quality_auditor/prompts.py`

**Step 1: Implement typed schemas**

- Add request and response models matching the locked contract.
- Keep AI-003 input optional.

**Step 2: Implement semantic runner**

- Add structured prompting and response parsing for:
  - `consistency`
  - `justification`
  - `coverage`
  - `completeness`
  - `policy`
- Generate stable `code` and `condition_fingerprint`.
- Keep raw malformed-payload handling outside AI-010 and in frontend/backend validation.

**Step 3: Implement route and repository**

- Add `/api/v1/workflows/review-quality-auditor/resolve`.
- Persist completed and failed runs.
- Do not add a current-artifact table.

**Step 4: Register workflow in `app/main.py`**

- initialize repo and runner
- include router

**Step 5: Run tests**

Run: `pytest ai-service/tests/test_review_quality_auditor_models.py ai-service/tests/test_review_quality_auditor_runner.py ai-service/tests/test_review_quality_auditor_routes.py ai-service/tests/test_review_quality_auditor_prompts.py -q`
Expected: PASS

**Step 6: Commit**

```bash
git add ai-service/app ai-service/alembic ai-service/tests/test_review_quality_auditor_*.py
git commit -m "feat: implement review quality auditor workflow"
```

### Task 5: Go AI-Service Client and Review-Audit Endpoint

**Files:**
- Modify: `backend/internal/clients/ai_service/client.go`
- Modify: `backend/internal/controller/assignment/assignment.go`
- Modify: `backend/internal/controller/controller.go`
- Modify: `backend/cmd/server/main.go`
- Create: `backend/internal/controller/assignment/review_audit_test.go`
- Create: `backend/tests/api/assignment/review_audit_test.go`

**Step 1: Add client request and response structs**

- Add typed client payloads for AI-010 request and response.
- Add client method for `ResolveReviewQualityAudit`.

**Step 2: Add browser-facing audit endpoint**

- Implement `POST /api/v1/conferences/{conference_id}/assignments/{assignment_id}/review-audit`.
- Accept current review payload and mode `draft_save | submit_preflight`.
- Load optional AI-003 artifact and policy context.

**Step 3: Reconcile findings with dismissal state**

- Keep blocking findings active.
- Move matching dismissed warnings into `dismissed_findings`.

**Step 4: Add tests**

- assigned reviewer can audit
- non-owner cannot audit
- active vs dismissed findings are split correctly
- AI-003 absence does not fail the route

**Step 5: Run tests**

Run: `go test ./internal/controller/assignment ./tests/api/assignment`
Expected: PASS

**Step 6: Commit**

```bash
git add backend/internal/clients/ai_service/client.go backend/internal/controller/assignment backend/internal/controller/controller.go backend/cmd/server/main.go backend/tests/api/assignment/review_audit_test.go
git commit -m "feat: add assignment review audit endpoint"
```

### Task 6: Backend Dismissal Endpoint and Event Logging

**Files:**
- Modify: `backend/internal/controller/assignment/assignment.go`
- Modify: `backend/internal/controller/controller.go`
- Modify: `backend/cmd/server/main.go`
- Create: `backend/tests/api/assignment/review_audit_dismissal_test.go`

**Step 1: Implement dismissal endpoint**

- Add `PUT /api/v1/conferences/{conference_id}/assignments/{assignment_id}/review-audit/dismissals`.
- Support `dismissed=true` and `dismissed=false`.

**Step 2: Append audit events**

- Write `warning_dismissed` and `warning_undismissed` events for every change.

**Step 3: Add tests**

- dismissal persists
- undismiss removes the entry
- non-owner access is rejected

**Step 4: Run tests**

Run: `go test ./tests/api/assignment -run ReviewAuditDismissal`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/controller/assignment/assignment.go backend/tests/api/assignment/review_audit_dismissal_test.go
git commit -m "feat: add review audit dismissal lifecycle"
```

### Task 7: Submit Enforcement and Override Flow

**Files:**
- Modify: `backend/internal/dto/assignment.go`
- Modify: `backend/internal/controller/assignment/assignment.go`
- Create: `backend/tests/api/assignment/review_submit_enforcement_test.go`

**Step 1: Extend submit request contract**

- Add explicit override field for audit-failure continuation, for example `override_audit_failure`.

**Step 2: Add enforcement flow**

- On `status=submitted`, run `submit_enforcement` before persistence.
- Reject malformed or incomplete submit payloads before AI-010 is called.
- Reject only on blocking findings that are justified by explicit policy or platform-defined enforcement.
- If workflow fails:
  - return explicit audit failure response
  - allow follow-up submit only with override flag

**Step 3: Log override**

- Append `submit_override_after_audit_failure` event on successful override submit.

**Step 4: Add tests**

- clean enforcement submits normally
- blocking findings reject submit
- workflow failure requires explicit override
- override is rejected if the prior failure was actually blocking findings

**Step 5: Run tests**

Run: `go test ./internal/controller/assignment ./tests/api/assignment -run ReviewSubmit`
Expected: PASS

**Step 6: Commit**

```bash
git add backend/internal/dto/assignment.go backend/internal/controller/assignment/assignment.go backend/tests/api/assignment/review_submit_enforcement_test.go
git commit -m "feat: enforce review audit on submit"
```

### Task 8: Frontend API Client and Hook

**Files:**
- Create: `frontend/lib/api/review-audit.ts`
- Create: `frontend/hooks/use-review-audit.ts`
- Create: `frontend/lib/api/__tests__/review-audit.test.ts`

**Step 1: Write failing client tests**

- audit request sends mode and current review payload
- dismissal update sends `code`, `condition_fingerprint`, `dismissed`

**Step 2: Implement API client**

- add `runReviewAudit`
- add `updateReviewAuditDismissal`

**Step 3: Implement hook**

- hold last audit result
- expose actions for draft-save audit, preflight audit, and dismissal updates

**Step 4: Run tests**

Run: `npm run test:run -- review-audit`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/lib/api/review-audit.ts frontend/hooks/use-review-audit.ts frontend/lib/api/__tests__/review-audit.test.ts
git commit -m "feat: add frontend review audit client"
```

### Task 9: Reviewer UI Integration

**Files:**
- Modify: `frontend/components/reviewer/submission-review.tsx`
- Create: `frontend/components/reviewer/submission-review/review-audit-panel.tsx`
- Create: `frontend/components/reviewer/submission-review/__tests__/review-audit-panel.test.tsx`

**Step 1: Add failing UI tests**

- draft save shows advisory findings
- submit preflight shows blocking findings
- warning dismiss action updates UI
- dismissed warnings render separately
- audit failure on submit shows explicit override confirmation path

**Step 2: Implement panel**

- render `active_findings`
- render collapsible `dismissed_findings`
- wire dismiss and undismiss
- render override confirmation when backend reports enforcement failure

**Step 3: Integrate into submission flow**

- use `draft_save` audit before or alongside draft save UX
- use `submit_preflight` before submit attempt
- keep backend authoritative by still handling submit enforcement responses

**Step 4: Run tests**

Run: `npm run test:run -- review-audit-panel`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/components/reviewer/submission-review.tsx frontend/components/reviewer/submission-review/review-audit-panel.tsx frontend/components/reviewer/submission-review/__tests__/review-audit-panel.test.tsx
git commit -m "feat: integrate review audit into reviewer workflow"
```

### Task 10: Full Verification and Documentation Check

**Files:**
- Modify if needed: `docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-design.md`
- Modify if needed: `docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-prd.md`
- Modify if needed: `docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-implementation-spec.md`

**Step 1: Run backend tests**

Run: `cd backend; go test ./...`
Expected: PASS or only known unrelated failures documented.

**Step 2: Run frontend tests**

Run: `cd frontend; npm run test:run`
Expected: PASS or only known unrelated failures documented.

**Step 3: Run ai-service tests**

Run: `cd ai-service; pytest -q`
Expected: PASS or only known unrelated failures documented.

**Step 4: Do manual smoke verification**

- reviewer sees advisory findings on draft save
- reviewer sees blocking findings on submit preflight
- reviewer can dismiss and undismiss warnings
- dismissed warning reopens after material review change
- submit blocks on blocking findings
- audit failure requires explicit override
- override is logged
- missing required fields are stopped by UI/backend validation before AI-010

**Step 5: Commit**

```bash
git add docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-design.md docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-prd.md docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-implementation-spec.md
git commit -m "docs: finalize ai-010 planning package"
```
