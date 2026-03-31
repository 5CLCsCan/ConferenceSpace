# AI-010 Review Quality and Consistency Auditor

## Overview

- Roadmap entry: [`docs/ai-integration.md`](../ai-integration.md)
- Canonical procedure: [`docs/ai-integration/procedure.md`](./procedure.md)
- Curated references:
  - [`references/AI-010/00-index.md`](./references/AI-010/00-index.md)
- Last reviewed: 2026-03-31

## Verdict

- Verdict: `partial`
- Rationale: AI-010 now exists as a real assignment-scoped reviewer workflow across the reviewer UI, Go backend, and `ai-service`. The shipped path audits the current review payload, surfaces active versus dismissed findings, persists warning dismissals as backend-owned assignment metadata, and enforces submit-time blocking on semantically grounded issue classes rather than trusting raw model severity labels.
- Rationale: the boundary is now corrected. Basic form integrity and malformed payload handling belong to the reviewer UI and backend validation, while AI-010 itself is an LLM-driven semantic audit over review consistency, justification, coverage, completeness, and optional policy context. AI-003 is optional additional material for coverage only.
- Rationale: the verdict remains `partial` rather than `complete` because end-to-end verification is strong for the main happy path and contradictory-review blocking path, but not yet closed on every operational edge. In particular, the audit-failure override flow was designed and implemented but was not revalidated in the latest live browser pass, and prompt calibration still deserves another example-driven tuning cycle to reduce overflagging risk.

## Lifecycle Status

| State | Status | Notes / Linked Artifact |
| --- | --- | --- |
| `create` | complete | This lifecycle record and `references/AI-010/` now establish the canonical AI-010 baseline. |
| `research` | complete | Roadmap scope, reviewer workflow anchors, and product boundary corrections are captured in the AI-010 planning package and reflected in the roadmap entry. |
| `design` | complete | The corrected semantic-audit design is locked in [`docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-design.md`](../plans/2026-03-31-ai-010-review-quality-consistency-auditor-design.md). |
| `plan` | complete | The PRD, implementation spec, and executable plan are locked in the `docs/plans/2026-03-31-ai-010-*` documents. |
| `implement` | complete | Reviewer-facing audit UI, backend audit routes and submit enforcement, dismissal persistence, and the `ai-service` workflow are in the codebase. |
| `verify` | partial | Targeted test suites passed and live browser validation covered advisory findings, contradictory submit blocking, successful grounded submit, and warning dismissal persistence. The audit-failure override path still needs explicit live revalidation. |
| `finalize` | partial | The corrected semantic boundary is now authoritative, but prompt calibration and one remaining failure-path verification pass are still open. |
| `supersede` | not started | No newer AI-010 lifecycle record supersedes this one. |

## Artifact Index

| Artifact Type | Artifact | Purpose |
| --- | --- | --- |
| Roadmap / Spec | [`docs/ai-integration.md`](../ai-integration.md) | Defines AI-010 as a reviewer workflow and now records the corrected semantic-audit product boundary. |
| Procedure | [`docs/ai-integration/procedure.md`](./procedure.md) | Defines the lifecycle-document format and update rules used here. |
| References | [`references/AI-010/00-index.md`](./references/AI-010/00-index.md) | Entry point for the AI-010 reference trail. |
| Discovery | [`docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-discovery.md`](../plans/2026-03-31-ai-010-review-quality-consistency-auditor-discovery.md) | Captures the reviewer story, current system anchors, and integration framing. |
| Design | [`docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-design.md`](../plans/2026-03-31-ai-010-review-quality-consistency-auditor-design.md) | Locks the corrected semantic-audit runtime boundary and lifecycle rules. |
| PRD | [`docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-prd.md`](../plans/2026-03-31-ai-010-review-quality-consistency-auditor-prd.md) | Defines user stories, non-goals, and product decisions. |
| Implementation Spec | [`docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-implementation-spec.md`](../plans/2026-03-31-ai-010-review-quality-consistency-auditor-implementation-spec.md) | Captures schema, route, persistence, and lifecycle details. |
| Plan | [`docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor.md`](../plans/2026-03-31-ai-010-review-quality-consistency-auditor.md) | Executable implementation plan for the workflow. |
| Implementation Evidence | `frontend/components/reviewer/submission-review.tsx`, `frontend/components/reviewer/submission-review/review-audit-panel.tsx`, `frontend/hooks/use-review-audit.ts`, `frontend/lib/api/review-audit.ts` | Reviewer-facing audit panel, unsaved-payload audit client path, and dismissal UX. |
| Implementation Evidence | `backend/internal/controller/assignment/review_audit.go`, `backend/internal/controller/assignment/assignment.go`, `backend/internal/storage/assignment/review_audit.go`, `backend/migrations/000039_add_review_audit_state.up.sql` | Browser-facing audit routes, submit enforcement, dismissal persistence, and backend-owned audit event storage. |
| Implementation Evidence | `ai-service/app/workflows/review_quality_auditor/prompts.py`, `ai-service/app/workflows/review_quality_auditor/runner.py`, `ai-service/app/workflows/review_quality_auditor/schemas.py`, `ai-service/app/workflows/review_quality_auditor/router.py`, `ai-service/app/repositories/review_quality_audit_repo.py`, `ai-service/alembic/versions/20260331_0006_review_quality_audit_runs.py` | Semantic audit prompt contract, routing, enforcement logic, structured schema, and workflow run persistence. |
| Verification Evidence | `frontend/components/reviewer/submission-review/__tests__/review-audit-panel.test.tsx`, `frontend/lib/api/__tests__/review-audit.test.ts`, `backend/internal/controller/assignment/review_audit_test.go`, `ai-service/tests/test_review_quality_audit_models.py`, `ai-service/tests/test_review_quality_audit_runner.py`, `ai-service/tests/test_review_quality_audit_routes.py` | Targeted test coverage for the reviewer audit surface, backend contract, and `ai-service` workflow. |

## Architecture / Data Flow

### Corrected Product Boundary

AI-010 is no longer described as a deterministic review linter. Its authoritative role is a reviewer-facing semantic audit that helps catch contradictions, weak justification, shallow coverage, and other review-quality problems before final submission.

The boundary is:

- reviewer UI and backend validation own basic form integrity
- AI-010 owns semantic review-quality auditing
- AI-003 is optional additional material for coverage only
- AI-010 must not recommend accept/reject, scores, or confidence levels

That separation matters because missing required fields or malformed payloads are not review-quality findings; they are ordinary form and API validation failures and should be stopped before AI-010 runs.

### Delivered Runtime Shape

The shipped runtime split is:

- reviewer submission screen as the interaction surface
- Go backend as the assignment ownership, dismissal-state, and submit-enforcement boundary
- `ai-service` as the typed semantic-audit workflow

The main flow is:

1. reviewer edits the current review draft
2. frontend validates obvious local integrity issues and sends the current unsaved review payload to the browser-facing audit route
3. Go backend revalidates request shape, loads optional AI-003 context, and calls `review-quality-auditor`
4. `ai-service` returns typed semantic findings
5. Go backend reconciles warnings against stored dismissal metadata and returns active versus dismissed findings
6. reviewer may dismiss warning findings or continue editing
7. on final submit, backend reruns AI-010 in enforcement mode before accepting `submitted`

### Enforcement Boundary

Submit blocking is platform-owned, not model-owned.

Inference: the important design correction in the shipped path is that the model identifies semantic issue classes, while the platform decides which classes are submit-fatal. That avoids a bad boundary where an LLM-produced severity label directly controls review submission.

## Interfaces / Tools / Dependencies

### Browser-Facing Routes

- `POST /api/v1/conferences/{conference_id}/assignments/{assignment_id}/review-audit`
- `PUT /api/v1/conferences/{conference_id}/assignments/{assignment_id}/review-audit/dismissals`
- `PUT /api/v1/conferences/{conference_id}/assignments/{assignment_id}/review`

The first route handles `draft_save` and `submit_preflight`, the dismissal route manages reviewer warning acknowledgments, and the existing review save route owns final submit enforcement.

### Internal Workflow Route

- `POST /api/v1/workflows/review-quality-auditor/resolve`

### Key Dependencies

- reviewer submission shell:
  - `frontend/components/reviewer/submission-review.tsx`
  - `frontend/components/reviewer/submission-review/review-audit-panel.tsx`
- frontend audit client path:
  - `frontend/hooks/use-review-audit.ts`
  - `frontend/lib/api/review-audit.ts`
- backend assignment review surface:
  - `backend/internal/controller/assignment/review_audit.go`
  - `backend/internal/controller/assignment/assignment.go`
  - `backend/internal/storage/assignment/review_audit.go`
- AI-003 as optional additional material:
  - `backend/internal/controller/assignment/briefing.go`
  - `ai-service/app/workflows/reviewer_pre_read_briefing/*`
- `ai-service` workflow:
  - `ai-service/app/workflows/review_quality_auditor/*`
  - `ai-service/app/repositories/review_quality_audit_repo.py`

## Delivered vs Partial vs Missing vs Deviations

### Delivered

- The reviewer review screen now has a dedicated AI-010 panel with active versus dismissed findings.
- The frontend audits the current unsaved review payload rather than only the last saved draft.
- Warning findings are dismissible and dismissal state persists as backend-owned assignment metadata.
- The backend owns audit routing, assignment authorization, dismissal reconciliation, and submit-time enforcement.
- The `ai-service` workflow now performs actual semantic audit and uses prompt-driven structured findings instead of a fake deterministic quality pass.
- Prompt refinement now explicitly distinguishes generic praise from paper-specific reasoning, revision-worthy weaknesses from reject-worthy weaknesses, and thin confidence from justified confidence.
- Live browser validation confirmed the main behavior:
  - contradictory review submission is blocked
  - grounded aligned review submission succeeds
  - warning dismissals persist across reload and rerun

### Partial

- The audit-failure override path is part of the implementation boundary and test plan, but it was not revalidated in the latest live browser pass after the semantic-enforcement correction.
- Prompt quality is materially better but still benefits from a curated example-calibration pass using real academic review payloads to reduce false positives on borderline-but-acceptable reviews.

### Missing

- Evidence-reference handling remains intentionally deferred.
- There is no dedicated chair-facing UI yet for “submitted after audit failure” events; logging exists as the initial visibility layer.

### Deviations

- Earlier AI-010 planning language and the old roadmap wording implied a deterministic review-quality gate. That framing is now explicitly rejected. AI-010 is a semantic AI workflow with ordinary UI and backend validation on either side of it, not a deterministic reviewer-scoring engine.

## Risks / Follow-ups

- Overflagging remains the main product risk if the prompt is not calibrated against realistic review payloads.
- Underflagging remains possible if the semantic issue-class mapping is too conservative for severe contradictions.
- The explicit audit-failure override flow should be rerun live so the canonical record can move from `partial` to `complete` verification.
- Surrounding reviewer-page instability still pollutes clean end-to-end validation in this environment:
  - reviewer discussion tab returned `403` on seeded assignments
  - login emitted a client-side parse error during the live validation environment
- AI-003-assisted coverage checks depend on the quality of the optional upstream briefing artifact and should stay narrow to avoid recommendation drift.

## Evidence Map

| Source | What It Proves |
| --- | --- |
| `docs/ai-integration.md` | The roadmap now records AI-010 as a workflow and should no longer describe it as deterministic review scoring. |
| `docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-design.md` | The corrected semantic-audit boundary, AI-003 scope, and lifecycle rules are the design source of truth. |
| `docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-prd.md` | User stories and product rules explicitly place structural validation outside AI-010 and semantic review auditing inside it. |
| `frontend/components/reviewer/submission-review.tsx`, `frontend/components/reviewer/submission-review/review-audit-panel.tsx` | The reviewer-facing audit surface is integrated into the real review workflow. |
| `frontend/hooks/use-review-audit.ts`, `frontend/lib/api/review-audit.ts` | The frontend now audits the current unsaved review payload and exposes dismissal updates. |
| `backend/internal/controller/assignment/review_audit.go` | The backend exposes reviewer audit and dismissal routes and reconciles stored dismissals against workflow findings. |
| `backend/internal/controller/assignment/assignment.go` | Final review submission reruns AI-010 at the backend enforcement boundary before persisting `submitted`. |
| `backend/internal/storage/assignment/review_audit.go`, `backend/migrations/000039_add_review_audit_state.up.sql` | Warning dismissal state and audit events are persisted outside reviewer-authored `review_data`. |
| `ai-service/app/workflows/review_quality_auditor/runner.py` | The semantic audit workflow, issue-class handling, and platform-owned enforcement seam are implemented in the shipped workflow. |
| `ai-service/app/workflows/review_quality_auditor/prompts.py`, `schemas.py` | The prompt and schema contract now steer paper-specific grounding, justification quality, and confidence interpretation. |
| `ai-service/tests/test_review_quality_audit_models.py`, `ai-service/tests/test_review_quality_audit_runner.py`, `ai-service/tests/test_review_quality_audit_routes.py` | The typed workflow contract and core runner behavior have automated test coverage. |
