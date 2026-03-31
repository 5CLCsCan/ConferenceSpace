# AI-006 Chair Decision Copilot

## Overview

- Roadmap entry: [`docs/ai-integration.md`](../ai-integration.md)
- Canonical procedure: [`docs/ai-integration/procedure.md`](./procedure.md)
- Curated references:
  - [`references/AI-006/00-index.md`](./references/AI-006/00-index.md)
  - [`references/AI-006/01-spec-and-recon.md`](./references/AI-006/01-spec-and-recon.md)
  - [`references/AI-006/02-current-state-audit.md`](./references/AI-006/02-current-state-audit.md)
  - [`references/AI-006/03-design-and-planning.md`](./references/AI-006/03-design-and-planning.md)
- Last reviewed: 2026-03-31

## Verdict

- Verdict: `shipped`
- Rationale: AI-006 now ships as a persisted, submission-scoped, advisory-only evidence synthesis workflow. The chair `reviews` tab includes an explicit `Generate recommendation` entry point, the Go backend exposes lookup/generate/regenerate submission routes backed by decision-relevant evidence fingerprinting, and `ai-service` now owns the shared artifact and lifetime run history model. The decision boundary remains intact because AI-006 never auto-runs, never mutates submission status, and never produces directional accept/reject advice.
- Scope note: AI-006 is locked as a persisted, submission-scoped, advisory-only evidence synthesis workflow. It must never recommend accept/reject, never auto-run on page load, and never mutate submission status outside the existing explicit chair action path.

## Lifecycle Status

| State | Status | Notes / Linked Artifact |
| --- | --- | --- |
| `create` | complete | This lifecycle record and `references/AI-006/` establish the canonical AI-006 baseline. |
| `research` | complete | The roadmap scope, chair workflow anchors, and evidence sources are normalized in [`01-spec-and-recon.md`](./references/AI-006/01-spec-and-recon.md) and [`02-current-state-audit.md`](./references/AI-006/02-current-state-audit.md). |
| `design` | complete | The implementation-ready design is locked in [`docs/plans/2026-03-31-ai-006-chair-decision-copilot-design.md`](../plans/2026-03-31-ai-006-chair-decision-copilot-design.md). |
| `plan` | complete | The PRD, implementation spec, and executable plan are locked in the `docs/plans/2026-03-31-ai-006-*` documents. |
| `implement` | complete | The frontend panel, frontend API client/hook, Go backend routes, evidence aggregation, `ai-service` workflow, and persistence models are now in the codebase. |
| `verify` | complete | Targeted frontend, backend, and `ai-service` test coverage exists for the new workflow contract and passed on 2026-03-31. |
| `finalize` | complete | The shipped implementation matches the locked advisory-only boundary and persistence model. |
| `supersede` | not started | No newer canonical AI-006 lifecycle record exists. |

## Artifact Index

| Artifact Type | Artifact | Purpose |
| --- | --- | --- |
| Roadmap / Spec | [`docs/ai-integration.md`](../ai-integration.md) | Defines AI-006 as a chair decision-support workflow and its current roadmap placement. |
| Research | [`docs/platform-recon.md`](../platform-recon.md) | Captures chair workflow, decisioning behavior, and current review/discussion/history surfaces. |
| Research | [`references/AI-006/01-spec-and-recon.md`](./references/AI-006/01-spec-and-recon.md) | Restates AI-006 as evidence synthesis rather than recommendation. |
| Research | [`references/AI-006/02-current-state-audit.md`](./references/AI-006/02-current-state-audit.md) | Maps current chair runtime anchors, review analytics, rebuttal signals, and workflow gaps. |
| Design | [`docs/plans/2026-03-31-ai-006-chair-decision-copilot-design.md`](../plans/2026-03-31-ai-006-chair-decision-copilot-design.md) | Final implementation-ready design baseline. |
| PRD | [`docs/plans/2026-03-31-ai-006-chair-decision-copilot-prd.md`](../plans/2026-03-31-ai-006-chair-decision-copilot-prd.md) | User-facing product contract and user stories. |
| Implementation Spec | [`docs/plans/2026-03-31-ai-006-chair-decision-copilot-implementation-spec.md`](../plans/2026-03-31-ai-006-chair-decision-copilot-implementation-spec.md) | Module, schema, route, and execution contract. |
| Plan | [`docs/plans/2026-03-31-ai-006-chair-decision-copilot.md`](../plans/2026-03-31-ai-006-chair-decision-copilot.md) | Executable implementation plan. |
| Implementation Precursor | `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx` | Current chair detail loader already aggregates submission, reviews, discussion, and history inputs. |
| Implementation Precursor | `frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx` | Current decision UI persists explicit `accept`/`reject` and already exposes rebuttal-aware review context. |
| Implementation Precursor | `frontend/lib/api/reviews.ts` and `frontend/components/chair/submission-analytics.tsx` | Current review analytics contract and derived decision-support metrics precedent. |
| References | [`references/AI-006/00-index.md`](./references/AI-006/00-index.md) | Entry point for the AI-006 reference trail. |

## Architecture / Data Flow

### Intended Runtime Shape

AI-006 is locked as a persisted workflow rather than an ad hoc chat capability. The runtime split is:

- frontend chair submission `reviews` tab as the entry point and renderer
- Go backend submission-scoped routes for lookup, generate, and regenerate
- `ai-service` workflow for typed artifact generation

The expected request path is:

1. chair opens the existing submission `reviews` tab
2. frontend performs `GET /decision-copilot`
3. Go backend verifies chair access, aggregates decision-relevant evidence, computes the evidence fingerprint, and reads the current artifact
4. frontend renders `idle | ready | stale | failed`
5. chair clicks `Generate recommendation` or `Regenerate`
6. Go backend writes a run record, calls `ai-service`, and updates the current artifact on success

### Evidence Inputs

AI-006 uses decision-relevant chair-visible evidence only:

- review payloads and statuses
- derived review analytics
- discussion activity
- rebuttal signals when rebuttal applies
- submission metadata visible to the chair
- decision-relevant history markers

AI-006 explicitly excludes:

- accept/reject recommendation output
- personalized chair steering prompts
- any autonomous call to `updateSubmissionStatus`

### Persistence Boundary

AI-006 keeps:

- one current artifact per submission
- append-only lightweight run history for the lifetime of the submission

The chair UI reads only the current artifact. Run history is internal-only for audit/debugging.

## Interfaces / Tools / Dependencies

### Browser-Facing Routes

- `GET /api/v1/conferences/{conference_id}/submissions/{submission_id}/decision-copilot`
- `POST /api/v1/conferences/{conference_id}/submissions/{submission_id}/decision-copilot/generate`
- `POST /api/v1/conferences/{conference_id}/submissions/{submission_id}/decision-copilot/regenerate`

### Internal Workflow Route

- `POST /api/v1/workflows/chair-decision-copilot/resolve`

### Key Dependencies

- Existing chair submission runtime:
  - `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx`
  - `frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx`
  - `frontend/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`
- Existing review analytics contract:
  - `frontend/lib/api/reviews.ts`
  - `frontend/components/chair/submission-analytics.tsx`
- Existing rebuttal-facing review UI:
  - `frontend/lib/api/rebuttal.ts`
  - `frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx`
- Workflow precedent for route split and persistence style:
  - `backend/internal/controller/assignment/briefing.go`
  - `ai-service/app/workflows/reviewer_pre_read_briefing/*`
  - `ai-service/app/repositories/reviewer_briefing_repo.py`
  - `ai-service/app/db/models.py`

### Related Schemas or Migrations

- Go backend DTOs and request/response contracts now exist for submission-scoped lookup/generate/regenerate.
- `ai-service` now includes AI-006-specific workflow schemas plus persistence models for current artifacts and lifetime run history.

## Delivered vs Partial vs Missing vs Deviations

### Delivered

- A dedicated copilot panel now renders inside the chair `reviews` tab above the explicit decision controls.
- The frontend now has a typed AI-006 API client, hook, UI states, and tests for `idle | ready | stale | failed`.
- The Go backend now exposes submission-scoped lookup/generate/regenerate handlers, aggregates reviews/discussion/rebuttal evidence, and computes decision-relevant evidence fingerprints.
- `ai-service` now persists one shared current artifact per submission plus append-only run records for the lifetime of the submission.
- The generated artifact remains evidence-only: no directional lean, no autonomous decision commit, and no page-load generation.

### Partial

- Broad backend API integration coverage still depends on the repo’s external `localhost:8080` test server convention, so AI-006 verification currently relies on targeted unit/component tests rather than a live end-to-end environment in this workspace session.

### Missing

- No dedicated UI for run history exists by design; run history remains internal-only.

### Deviations

- The roadmap currently says “recommendation package,” but the accepted design forbids directional recommendation output. AI-006 is evidence synthesis, not verdict advice.

## Risks / Follow-ups

- Authority drift remains the primary product risk if the panel visually blends into the decision form.
- Rebuttal-derived analytics must stay conditional while rebuttal configuration evolves.
- Fingerprint invalidation must remain limited to decision-relevant evidence changes or the artifact will become unstable and noisy.
- The roadmap wording should be corrected later to remove directional “recommendation” framing.

## Evidence Map

| Source | What It Proves |
| --- | --- |
| `docs/ai-integration.md` | AI-006 is in the roadmap as a chair workflow item and needs a canonical lifecycle record. |
| `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx` | The current chair detail route already aggregates submission, reviews, discussion, and derived history. |
| `frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx` | The current decision surface is explicit chair-owned accept/reject persistence and rebuttal-aware review context. |
| `frontend/components/chair/conference-detail/submission-detail/chair-decision-copilot-panel.tsx` | The shipped chair-facing AI-006 surface lives in the existing `reviews` tab and keeps the copilot distinct from the decision form. |
| `frontend/lib/api/chair-decision-copilot.ts` | The frontend AI-006 route contract is typed and submission-scoped. |
| `frontend/components/chair/submission-analytics.tsx` | Existing review analytics precedent already derives consensus/disagreement-style signals from the review contract. |
| `backend/internal/controller/submission/decision_copilot.go` | The backend now aggregates evidence, computes fingerprints, and delegates to `ai-service` using explicit lookup/generate/regenerate actions. |
| `ai-service/app/workflows/chair_decision_copilot/runner.py` | The workflow now enforces shared-current-artifact semantics, stale detection, regenerate behavior, and failure preservation. |
| `ai-service/app/repositories/decision_copilot_repo.py` | Current artifact persistence and lifetime run history are implemented. |
| `docs/plans/2026-03-31-ai-006-chair-decision-copilot-design.md` | The AI-006 product and technical design remains the source of truth for the delivered boundary. |
