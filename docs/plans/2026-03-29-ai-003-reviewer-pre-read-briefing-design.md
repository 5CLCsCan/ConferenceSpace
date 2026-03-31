# AI-003 Reviewer Pre-Read Briefing Design

## Status

- State: implemented and verified as the shipped AI-003 baseline.
- Last updated: 2026-03-31
- Purpose: preserve the final design baseline that was implemented after the product-boundary reset.

## Primary References

- Roadmap and lifecycle procedure:
  - `docs/ai-integration.md`
  - `docs/ai-integration/procedure.md`
- Paired implementation plan:
  - `docs/plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md`
- Platform and workflow recon:
  - `docs/platform-recon.md`
  - `docs/feature-mapping.md`
- Existing reviewer UI and contracts:
  - `frontend/components/reviewer/submission-review.tsx`
  - `frontend/components/reviewer/submission-review/review-sidebar.tsx`
  - `frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx`
  - `frontend/hooks/use-assignment-review.ts`
  - `frontend/lib/api/reviews.ts`
- Existing backend and `ai-service` boundaries:
  - `backend/internal/storage/reviewer/reviewer.go`
  - `backend/internal/controller/submission/submission.go`
  - `backend/internal/model/submission.go`
  - `backend/internal/clients/ai_service/client.go`
  - `ai-service/app/main.py`
  - `ai-service/app/db/models.py`
  - `ai-service/app/workflows/submission_gating/router.py`
  - `ai-service/app/workflows/submission_gating/runner.py`
  - `ai-service/app/workflows/reviewer_pre_read_briefing/*`

## Design Reset

The earlier AI-003 baseline failed at the product-definition level. It tried to deliver a "pre-read submission analysis briefing" without ingesting the manuscript body and instead drifted toward abstract-plus-discussion or rebuttal context. That was logically wrong and increased bias risk.

The corrected product definition is narrower and defensible:

- AI-003 is a neutral submission pre-read.
- It exists to reduce reviewer reading and rereading effort.
- It analyzes the submission itself.
- It does not interpret review-process context.
- It does not give opinions, decisions, or score-like steering.

## 1. Product Boundary And UI Placement

- AI-003 is reviewer-initiated.
- Generation starts only after the reviewer clicks `Start generating`.
- The feature stays in the existing small AI card in the reviewer submission sidebar.
- The current freeform prompt textarea is wrong for this feature and should be removed.
- The UI state machine remains simple:
  - `idle`
  - `generating`
  - `ready`
  - `failed`
  - `stale`

## 2. Correct Source Contract

The model input is submission-only:

- manuscript content
- title
- abstract
- keywords
- track and similar reviewer-visible paper metadata

The model input is not:

- discussion
- rebuttal
- precheck output
- chair-only context
- recommendation history
- reviewer-authored prompt text

This is the most important correction in the entire design.

## 3. Compatible Runtime Architecture

- Frontend remains in the existing reviewer sidebar card.
- Go backend remains the public API boundary.
- `ai-service` remains the workflow and persistence boundary.

The corrected request path should be:

1. reviewer opens assigned submission
2. reviewer clicks `Start generating`
3. frontend calls assignment-scoped Go route
4. Go verifies assignment ownership
5. Go loads reviewer-visible submission metadata and the manuscript file from storage
6. Go forwards the manuscript payload to `ai-service`
7. `ai-service` extracts text, normalizes the manuscript bundle, generates the typed artifact, persists it, and returns the terminal state

This keeps the public surface compatible with the current reviewer flow while moving document extraction to the system that already has extraction precedent.

## 4. Extraction Strategy

Full-submission ingestion is mandatory for AI-003. The cleanest compatible path is to reuse the extraction precedent already present in `ai-service` submission gating instead of implementing a second parser in Go.

Recommended v1 direction:

- keep extraction in `ai-service`
- reuse or factor the existing PDF, DOCX, and LaTeX extractors
- send manuscript bytes plus minimal reviewer-visible metadata through the internal AI-003 resolve route

Do not defer full manuscript ingestion in v1. If that is deferred, the feature promise collapses.

## 5. Artifact Schema And Guardrails

The artifact should stay typed JSON. It should be descriptive, not evaluative.

Recommended sections:

- `submission_snapshot`
- `claimed_contributions`
- `notable_elements`
- `reviewer_attention_points`
- `stated_scope_and_limitations`
- `guardrails`

Hard prohibitions:

- no accept or reject recommendation
- no predicted score
- no publication-likelihood framing
- no "overall assessment" language
- no discussion or rebuttal summaries

The "attention points" section should tell the reviewer what to verify manually, not what to conclude.

## 6. Routes, Persistence, And Cache Model

Browser-facing routes stay assignment-scoped:

- `GET /api/v1/conferences/{conference_id}/assignments/{assignment_id}/briefing`
- `POST /api/v1/conferences/{conference_id}/assignments/{assignment_id}/briefing/generate`

Internal workflow route may stay resolve-style:

- `POST /api/v1/workflows/reviewer-pre-read-briefing/resolve`

The corrected internal request should be based on submission material, not the current `discussion_context` or `rebuttal_context` schema.

Cache model correction:

- do not use `submission_version`
- the backend does not have that field
- use a real submission-state marker from current reviewer-visible submission state plus extraction or prompt versions

The existing `reviewer_briefing_*` tables are reusable in principle, but their payload shape and version fields need to be corrected.

## 7. Security Boundary

The current `submission.GetFile` route is not a safe AI-003 dependency because it does not enforce reviewer assignment ownership.

Required rule:

- AI-003 manuscript loading must happen only after assignment ownership is verified

This can be implemented either as:

- a dedicated assignment-owned manuscript loader used only by the briefing controller
- or a stricter shared file-access path that enforces the same reviewer assignment check

Do not route AI-003 through the existing generic submission file controller unchanged.

## 8. Failure Modes

- extraction failure should be explicit
- low-text-coverage extraction should be explicit
- LLM failure should persist `failed`
- missing manuscript file should fail early in Go
- `stale` should mean the stored artifact no longer matches current submission state

No part of this flow should silently degrade into an abstract-only summary.

## 9. Verification Boundary

Required frontend verification:

- prompt textarea removed
- card states render correctly
- typed artifact sections render without markdown parsing as the canonical contract

Required Go verification:

- assignment ownership required
- non-owner reviewer and author are denied
- manuscript load path is reviewer-safe
- stale detection tracks real submission state changes

Required `ai-service` verification:

- manuscript extraction path works for supported formats
- corrected typed schema is enforced
- cache hit and stale behavior match the corrected source contract
- recommendation or scoring language is rejected or stripped

## Implementation Outcome

This design was implemented on the corrected terms:

- submission-only input
- real manuscript ingestion
- neutral typed artifact
- reviewer-safe manuscript access in Go
- synchronous generation with cache

Anything that reintroduces discussion, rebuttal, abstract-only input, or fictional `submission_version` semantics remains a regression from the shipped baseline.
