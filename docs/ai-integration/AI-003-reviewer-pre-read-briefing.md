# AI-003 Reviewer Pre-Read Briefing

## Overview

- Roadmap entry: [`docs/ai-integration.md`](../ai-integration.md)
- Canonical procedure: [`docs/ai-integration/procedure.md`](./procedure.md)
- Curated references:
  - [`references/AI-003/00-index.md`](./references/AI-003/00-index.md)
  - [`references/AI-003/01-spec-and-recon.md`](./references/AI-003/01-spec-and-recon.md)
  - [`references/AI-003/02-current-state-audit.md`](./references/AI-003/02-current-state-audit.md)
  - [`references/AI-003/03-design-and-execution.md`](./references/AI-003/03-design-and-execution.md)
- Last reviewed: 2026-03-31

## Verdict

- Verdict: `implemented`
- Rationale: AI-003 now ships as a submission-only reviewer pre-read workflow with assignment-scoped backend routes, reviewer-safe manuscript loading, `ai-service` extraction plus structured generation, and a typed reviewer UI rendered from persisted artifact data.
- Rationale: the delivered flow enforces the corrected product boundary: manuscript-backed input only, neutral artifact sections only, no discussion or rebuttal context, and cache freshness keyed by `submission_state_fingerprint`.
- Rationale: the reviewer sidebar card is now a real stateful entry point with `idle | generating | ready | stale | failed`, and the generated artifact is rendered through the modal analysis workspace rather than mock prompt text.

## Lifecycle Status

| State | Status | Notes / Linked Artifact |
| --- | --- | --- |
| `create` | complete | This lifecycle record and reference folder remain the canonical AI-003 record. |
| `research` | complete | Roadmap scope, current workflow surfaces, and the design reset are normalized in the AI-003 reference notes. |
| `design` | complete | The corrected submission-only design baseline is locked in [`docs/plans/2026-03-29-ai-003-reviewer-pre-read-briefing-design.md`](../plans/2026-03-29-ai-003-reviewer-pre-read-briefing-design.md). |
| `plan` | complete | The corrected implementation plan is locked in [`docs/plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md`](../plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md). |
| `implement` | complete | AI-003 is implemented end-to-end across frontend, Go backend, and `ai-service`. |
| `verify` | complete | Targeted frontend, backend, and `ai-service` verification passed, plus live browser smoke validation on the reviewer assignment screen. |
| `finalize` | complete | The corrected submission-only design is now the shipped baseline rather than an implementation target. |
| `supersede` | not started | No newer AI-003 lifecycle record supersedes this one. |

## Artifact Index

| Artifact Type | Artifact | Purpose |
| --- | --- | --- |
| Roadmap / Spec | [`docs/ai-integration.md`](../ai-integration.md) | Defines the corrected AI-003 product boundary, trigger, inputs, outputs, and dependency. |
| Procedure | [`docs/ai-integration/procedure.md`](./procedure.md) | Defines the canonical lifecycle-document structure and evidence rules used here. |
| Research | [`references/AI-003/01-spec-and-recon.md`](./references/AI-003/01-spec-and-recon.md) | Restates AI-003 as a submission-only pre-read instead of a process-context briefing. |
| Research | [`references/AI-003/02-current-state-audit.md`](./references/AI-003/02-current-state-audit.md) | Maps the usable current system anchors and the blocker set that had to be resolved. |
| Design | [`references/AI-003/03-design-and-execution.md`](./references/AI-003/03-design-and-execution.md) | Concise runtime and rollout summary for the corrected v1. |
| Design | [`docs/plans/2026-03-29-ai-003-reviewer-pre-read-briefing-design.md`](../plans/2026-03-29-ai-003-reviewer-pre-read-briefing-design.md) | Corrected detailed design baseline. |
| Plan | [`docs/plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md`](../plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md) | Task-by-task implementation plan for the corrected v1. |
| Implementation Evidence | `frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx` | Reviewer assignment context is resolved before the review screen renders. |
| Implementation Evidence | `frontend/components/reviewer/submission-review.tsx`, `frontend/components/reviewer/submission-review/review-sidebar.tsx`, `frontend/hooks/use-assignment-briefing.ts`, `frontend/lib/api/reviewer-briefing.ts` | Shipped reviewer UI placement, assignment briefing client, hook, and typed modal rendering. |
| Implementation Evidence | `backend/internal/controller/assignment/briefing.go`, `backend/internal/clients/ai_service/client.go` | Assignment-scoped briefing lookup or generation, reviewer ownership checks, manuscript loading, and proxying into `ai-service`. |
| Implementation Evidence | `ai-service/app/workflows/reviewer_pre_read_briefing/*`, `ai-service/app/repositories/reviewer_briefing_repo.py`, `ai-service/app/db/models.py` | Shipped workflow router, structured generation runner, prompt contract, persistence, and cache handling. |
| Verification Evidence | `frontend/components/reviewer/submission-review/__tests__/review-sidebar.test.tsx`, `frontend/lib/api/__tests__/reviewer-briefing.test.ts`, `backend/internal/controller/assignment/briefing_test.go`, `backend/tests/api/assignment/briefing_test.go`, `ai-service/tests/test_reviewer_briefing_*` | Targeted UI, API-client, backend, and `ai-service` test coverage for AI-003. |

## Architecture / Data Flow

### Delivered Product Boundary

AI-003 is now shipped as a reviewer-triggered submission pre-read assistant. Its purpose is unchanged from the corrected design reset: reduce reviewer reading and rereading effort before manual review by surfacing the high-signal parts of the submission itself while remaining neutral.

Shipped source boundary:

- manuscript content
- title
- abstract
- keywords
- track and reviewer-visible file metadata

Still out of scope in the shipped feature:

- discussion
- rebuttal
- precheck output
- chair-only context
- recommendation or score framing

### Delivered Runtime Shape

The shipped runtime split follows the corrected architecture:

- frontend reviewer sidebar card as the entry point and modal renderer
- Go backend for reviewer auth, assignment ownership checks, manuscript loading, and proxying
- `ai-service` for extraction, normalization, structured generation, cache lookup, and persistence

The reviewer assignment page still resolves `assignment_id -> conference_id -> submission_id` before rendering the review surface, so AI-003 fits the existing assignment-centric reviewer shell rather than introducing a parallel flow.

## Interfaces / Tools / Dependencies

### Browser-Facing Routes

- `GET /api/v1/conferences/{conference_id}/assignments/{assignment_id}/briefing`
- `POST /api/v1/conferences/{conference_id}/assignments/{assignment_id}/briefing/generate`

These routes now:

- authenticate the reviewer
- verify assignment ownership before briefing access or generation
- load the assigned submission plus manuscript payload
- compute `submission_state_fingerprint`
- proxy only reviewer-visible submission material into `ai-service`

### Internal AI-Service Contract

The internal workflow can keep the single resolve-style route:

- `POST /api/v1/workflows/reviewer-pre-read-briefing/resolve`

The shipped request boundary carries:

- reviewer-visible submission metadata
- manuscript file bytes or reviewer-safe file payload on `generate`
- action `lookup | generate`
- reviewer-visible submission metadata
- `submission_state_fingerprint`

It should not carry:

- `discussion_context`
- `rebuttal_context`
- `precheck_context`
- fake `submission_version` values that do not exist in the backend source of truth

### Cache Basis

AI-003 now uses a real submission-state marker rather than a fictional `submission_version`. The fingerprint is derived from current reviewer-visible submission state, including submission metadata, timestamps, and file metadata.

## Delivered Scope And Resolved Deviations

### Delivered

- Reviewer sidebar card replaced the old mock flow with real briefing lookup or generation states.
- Frontend now uses a dedicated assignment briefing API client and hook.
- Backend now exposes assignment-scoped lookup and generate routes with reviewer ownership enforcement.
- Backend manuscript loading is performed after assignment verification rather than through the generic file route.
- `ai-service` now runs manuscript-backed structured generation, persists artifacts, and reuses cache via `submission_state_fingerprint`.
- The typed artifact now includes neutral sections for snapshot, contributions, notable elements, attention points, scope or limitations, guardrails, and review-readiness signals.

### Historical Deviations Resolved

- The earlier abstract-plus-discussion baseline is no longer the shipped contract.
- `submission_version` is no longer part of the public AI-003 contract.
- The shipped UI no longer uses freeform prompt text or raw markdown as the canonical artifact.

## Risks / Follow-ups

- Anchoring bias remains the main product risk. The shipped artifact must remain descriptive, not evaluative.
- Extraction quality remains part of AI-003 correctness. If parser coverage is weak, the workflow should fail explicitly or surface the limitation clearly.
- Some browsers may not render the PDF inline preview consistently even though manuscript download and generation still work. That is a UI rendering follow-up, not a workflow blocker.
- If synchronous manuscript extraction plus generation becomes too slow under real load, async execution can be considered later. It is not required for the shipped v1.

## Evidence Map

| Source | What It Proves |
| --- | --- |
| `docs/ai-integration.md` | The roadmap entry now records AI-003 as a shipped submission-only workflow. |
| `frontend/components/reviewer/submission-review.tsx`, `frontend/components/reviewer/submission-review/review-sidebar.tsx` | The reviewer UI now exposes the real AI-003 card and modal rendering flow. |
| `frontend/hooks/use-assignment-briefing.ts`, `frontend/lib/api/reviewer-briefing.ts` | Dedicated frontend briefing retrieval and generation client path. |
| `backend/internal/controller/assignment/briefing.go` | Reviewer-safe assignment lookup, fingerprint computation, and manuscript-backed generation boundary. |
| `backend/internal/clients/ai_service/client.go` | Assignment briefing client request and multipart generation path into `ai-service`. |
| `ai-service/app/workflows/reviewer_pre_read_briefing/schemas.py`, `runner.py`, `prompts.py` | Shipped structured schema, manuscript-backed generation flow, prompt contract, and readiness-signal handling. |
| `ai-service/app/repositories/reviewer_briefing_repo.py`, `ai-service/app/db/models.py` | Persisted artifact and run storage keyed by `submission_state_fingerprint`. |
