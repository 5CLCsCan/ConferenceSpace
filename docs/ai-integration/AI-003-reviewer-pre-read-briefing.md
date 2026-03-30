# AI-003 Reviewer Pre-Read Briefing

## Overview

- Roadmap entry: [`docs/ai-integration.md`](../ai-integration.md)
- Canonical procedure: [`docs/ai-integration/procedure.md`](./procedure.md)
- Curated references:
  - [`references/AI-003/00-index.md`](./references/AI-003/00-index.md)
  - [`references/AI-003/01-spec-and-recon.md`](./references/AI-003/01-spec-and-recon.md)
  - [`references/AI-003/02-current-state-audit.md`](./references/AI-003/02-current-state-audit.md)
  - [`references/AI-003/03-design-and-execution.md`](./references/AI-003/03-design-and-execution.md)
- Last reviewed: 2026-03-30

## Verdict

- Verdict: `needs work`
- Rationale: AI-003 was initially designed and partially implemented as a reviewer-context briefing, not a true submission pre-read. The current partial `ai-service` workflow still models `paper_snapshot + discussion_context + rebuttal_context` instead of real manuscript ingestion (`ai-service/app/workflows/reviewer_pre_read_briefing/schemas.py:23-76`, `ai-service/app/workflows/reviewer_pre_read_briefing/runner.py:28-82`, `ai-service/app/workflows/reviewer_pre_read_briefing/runner.py:136-174`).
- Rationale: the current reviewer UI is still a mock card with freeform prompt input and fake output rather than a neutral typed pre-read artifact (`frontend/components/reviewer/submission-review/review-sidebar.tsx:88-340`).
- Rationale: the backend has manuscript storage and reviewer assignment context, but the existing submission file download route does not enforce reviewer assignment ownership, so it is not a safe AI-003 ingestion boundary (`backend/internal/storage/reviewer/reviewer.go:982-1011`, `backend/internal/controller/submission/submission.go:840-883`).
- Re-evaluation: a feature called "pre-read submission" must ingest actual reviewer-visible manuscript content. Abstract-only plus discussion or rebuttal context is logically wrong for this product and increases anchoring risk rather than reducing reviewer reading effort.

## Lifecycle Status

| State | Status | Notes / Linked Artifact |
| --- | --- | --- |
| `create` | complete | This lifecycle record and reference folder remain the canonical AI-003 record. |
| `research` | complete | Roadmap scope, current workflow surfaces, and the design reset are normalized in the AI-003 reference notes. |
| `design` | complete | The corrected submission-only design baseline is locked in [`docs/plans/2026-03-29-ai-003-reviewer-pre-read-briefing-design.md`](../plans/2026-03-29-ai-003-reviewer-pre-read-briefing-design.md). |
| `plan` | complete | The corrected implementation plan is locked in [`docs/plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md`](../plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md). |
| `implement` | partial | Partial AI-003 code exists in `ai-service` and test scaffolding exists in backend, but both are aligned to the wrong input boundary and there is no correct end-to-end reviewer flow yet. |
| `verify` | partial | Current-state claims are checked against live frontend, backend, and `ai-service` code, but there is no passing end-to-end implementation for the corrected contract. |
| `finalize` | partial | The corrected design direction is now stable, but the shipped implementation is still incomplete and mis-scoped. |
| `supersede` | not started | No newer AI-003 lifecycle record supersedes this one. |

## Artifact Index

| Artifact Type | Artifact | Purpose |
| --- | --- | --- |
| Roadmap / Spec | [`docs/ai-integration.md`](../ai-integration.md) | Defines the corrected AI-003 product boundary, trigger, inputs, outputs, and dependency. |
| Procedure | [`docs/ai-integration/procedure.md`](./procedure.md) | Defines the canonical lifecycle-document structure and evidence rules used here. |
| Research | [`references/AI-003/01-spec-and-recon.md`](./references/AI-003/01-spec-and-recon.md) | Restates AI-003 as a submission-only pre-read instead of a process-context briefing. |
| Research | [`references/AI-003/02-current-state-audit.md`](./references/AI-003/02-current-state-audit.md) | Maps the usable current system anchors and the real blockers. |
| Design | [`references/AI-003/03-design-and-execution.md`](./references/AI-003/03-design-and-execution.md) | Concise runtime and rollout summary for the corrected v1. |
| Design | [`docs/plans/2026-03-29-ai-003-reviewer-pre-read-briefing-design.md`](../plans/2026-03-29-ai-003-reviewer-pre-read-briefing-design.md) | Corrected detailed design baseline. |
| Plan | [`docs/plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md`](../plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md) | Task-by-task implementation plan for the corrected v1. |
| Implementation Evidence | `frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx` | Shows that reviewer assignment context is already resolved before the review screen renders. |
| Implementation Evidence | `frontend/components/reviewer/submission-review.tsx`, `frontend/components/reviewer/submission-review/review-sidebar.tsx` | Shows the existing placement and the current mock AI card that must be replaced. |
| Implementation Evidence | `backend/internal/storage/reviewer/reviewer.go`, `backend/internal/controller/submission/submission.go` | Shows manuscript metadata is available to reviewer flows, but safe manuscript file access is not yet enforced at the controller boundary. |
| Implementation Evidence | `ai-service/app/workflows/submission_gating/*` | Shows the current extraction precedent for PDF, DOCX, and LaTeX. |
| Implementation Evidence | `ai-service/app/workflows/reviewer_pre_read_briefing/*`, `ai-service/app/db/models.py`, `ai-service/alembic/versions/20260330_0004_reviewer_briefing_tables.py` | Shows there is already partial AI-003 code and persistence, but on the wrong contract. |

## Architecture / Data Flow

### Correct Product Boundary

AI-003 is a reviewer-triggered submission pre-read assistant. Its job is to reduce reviewer reading and rereading effort before manual review by extracting the high-signal parts of the submission itself. It must stay neutral: no recommendations, no predicted scores, no decision framing, no chair-only context, and no review-process context.

That means the model input is submission-only:

- manuscript content
- title
- abstract
- keywords
- track or similar paper metadata when reviewer-visible

That also means discussion, rebuttal, and precheck output are out of scope for v1. Including them would turn AI-003 into a review-process interpreter instead of a submission pre-read.

### Compatible Runtime Shape

The existing reviewer assignment page already resolves `assignment_id -> conference_id -> submission_id` before the review screen renders (`frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx:37-99`). The current AI card placement in the reviewer sidebar is also already correct (`frontend/components/reviewer/submission-review.tsx:228-241`, `frontend/components/reviewer/submission-review/review-sidebar.tsx:88-219`).

The corrected runtime split should therefore stay:

- frontend card in the existing reviewer sidebar
- Go backend for reviewer authorization, assignment ownership checks, manuscript loading, and proxying
- `ai-service` for extraction, normalization, structured generation, caching, and persistence

### Required Manuscript Ingestion

The backend already stores manuscript file metadata with submissions and reviewer-facing assignment queries already pull that metadata (`backend/internal/storage/reviewer/reviewer.go:994-998`). `ai-service` already has document extraction precedent through submission gating for PDF, DOCX, and LaTeX (`ai-service/app/workflows/submission_gating/runner.py:52-55`, `ai-service/app/workflows/submission_gating/models/facts.py:33-48`).

Inference: the highest-ROI compatible path is to reuse or extract the existing `ai-service` document extraction capability for AI-003 rather than invent a second parser in Go.

## Interfaces / Tools / Dependencies

### Browser-Facing Routes

- `GET /api/v1/conferences/{conference_id}/assignments/{assignment_id}/briefing`
- `POST /api/v1/conferences/{conference_id}/assignments/{assignment_id}/briefing/generate`

These routes should:

- authenticate the reviewer
- verify assignment ownership using the same strict pattern as the review endpoints
- load the assigned submission and manuscript file metadata
- avoid the generic submission file route as an authorization shortcut
- proxy only reviewer-visible submission material into `ai-service`

### Internal AI-Service Contract

The internal workflow can keep the single resolve-style route:

- `POST /api/v1/workflows/reviewer-pre-read-briefing/resolve`

But the corrected request boundary is different from the current partial implementation. It should carry:

- reviewer-visible submission metadata
- manuscript file bytes or a reviewer-safe file payload
- action `lookup | generate`
- internal prompt or extraction version markers

It should not carry:

- `discussion_context`
- `rebuttal_context`
- `precheck_context`
- fake `submission_version` values that do not exist in the backend source of truth

### Cache Basis

The old plan repeatedly referred to `submission_version`, but the backend submission model does not actually have that field (`backend/internal/model/submission.go:32-62`, `backend/internal/dto/submission.go:31-53`).

The corrected cache basis should therefore be a real submission-state marker built from current reviewer-visible submission state, such as:

- `submission_id`
- `submission.updated_at`
- file metadata that changes when the manuscript changes
- extraction version
- prompt version

`ai-service` may additionally persist a stronger normalized source hash after extraction, but the docs should stop pretending the system has a first-class submission version number when it does not.

## Delivered vs Partial vs Missing vs Deviations

### Delivered

- The intended AI-003 UI placement already exists in the reviewer submission sidebar (`frontend/components/reviewer/submission-review.tsx:228-241`).
- The reviewer assignment page already resolves assignment context before rendering the review screen (`frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx:37-99`).
- Manuscript file metadata is already stored on submissions and already appears in reviewer assignment query results (`backend/internal/model/submission.go:41-56`, `backend/internal/storage/reviewer/reviewer.go:994-998`).
- `ai-service` already has extraction machinery for manuscript formats through submission gating (`ai-service/app/workflows/submission_gating/models/facts.py:33-48`).

### Partial

- A partial AI-003 workflow already exists in `ai-service`, with router, runner, persistence tables, and tests, but it is built around the wrong source model and artifact semantics (`ai-service/app/main.py:20-21`, `ai-service/app/db/models.py:174-240`, `ai-service/app/workflows/reviewer_pre_read_briefing/schemas.py:23-179`).
- Backend test scaffolding already exists for briefing behavior, but it still encodes the old discussion and rebuttal normalization assumptions (`backend/internal/controller/assignment/briefing_test.go:5-92`, `backend/tests/api/assignment/briefing_test.go:11-47`).

### Missing

- No correct end-to-end reviewer flow exists for the corrected submission-only AI-003 contract.
- No reviewer-safe manuscript retrieval boundary exists yet for AI-003. The generic submission file controller is too permissive for this use (`backend/internal/controller/submission/submission.go:840-883`).
- No corrected typed artifact schema exists yet for a neutral submission-only pre-read.
- No frontend API client, hook, or typed rendering exists for the corrected flow.
- No cache strategy exists yet that matches the real backend data model.

### Deviations

- The previous AI-003 baseline was wrong in product meaning: it tried to deliver a "pre-read" without ingesting the submission body.
- The current partial AI-003 implementation still fingerprints and normalizes discussion and rebuttal context even though those are not part of the corrected product boundary (`ai-service/app/workflows/reviewer_pre_read_briefing/runner.py:136-174`).
- The old design and plan assumed a `submission_version` concept that is not present in the backend model.

## Risks / Follow-ups

- Anchoring bias remains the main product risk. The artifact must stay descriptive, not evaluative.
- Reviewer-safe manuscript access is a real blocker, not a documentation detail. AI-003 should not piggyback on weaker submission file routes.
- Extraction quality is now part of AI-003 correctness. If the parser fails or produces low-coverage text, the workflow must fail explicitly or mark that limitation clearly.
- Cache invalidation must be tied to real submission state, not imaginary version fields.
- If synchronous manuscript extraction plus generation is too slow in practice, durable async execution can be designed later. It should not be invented prematurely in v1.

## Evidence Map

| Source | What It Proves |
| --- | --- |
| `docs/ai-integration.md:80-103` | The roadmap entry now defines AI-003 as submission-only, reviewer-triggered, and neutral. |
| `frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx:37-99` | Reviewer assignment context is already resolved before the review UI renders. |
| `frontend/components/reviewer/submission-review.tsx:228-241` | The AI card is already mounted in the right reviewer submission-detail location. |
| `frontend/components/reviewer/submission-review/review-sidebar.tsx:88-340` | The current AI card is still a mock with freeform prompt input and fake output. |
| `backend/internal/storage/reviewer/reviewer.go:982-1011` | Reviewer assignment queries already include submission file metadata. |
| `backend/internal/controller/submission/submission.go:840-883` | The current submission file route does not enforce reviewer assignment ownership. |
| `backend/internal/model/submission.go:32-62` | The backend source-of-truth model has manuscript file metadata but no first-class `submission_version`. |
| `ai-service/app/workflows/submission_gating/models/facts.py:33-48` | `ai-service` already has extracted-document structures that can anchor manuscript parsing. |
| `ai-service/app/workflows/reviewer_pre_read_briefing/schemas.py:23-76` | The current partial AI-003 request schema is still abstract-plus-discussion/rebuttal based. |
| `ai-service/app/workflows/reviewer_pre_read_briefing/runner.py:136-174` | The current partial runner still normalizes discussion and rebuttal context, which is now out of scope. |
