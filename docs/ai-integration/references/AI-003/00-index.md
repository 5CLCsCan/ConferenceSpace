# AI-003 Reference Index

## Purpose

This folder is the curated navigation layer for AI-003. The main lifecycle record remains [`AI-003-reviewer-pre-read-briefing.md`](../../AI-003-reviewer-pre-read-briefing.md); these notes now point readers to the corrected product boundary, the shipped execution baseline, and the historical reset that produced the final implementation.

## Reference Notes

| Note | Role |
| ---- | ---- |
| [`01-spec-and-recon.md`](./01-spec-and-recon.md) | Restates AI-003 as a submission-only pre-read and records the design reset from the earlier invalid baseline. |
| [`02-current-state-audit.md`](./02-current-state-audit.md) | Maps the current shipped reviewer card, assignment page, manuscript-loading boundary, and `ai-service` workflow anchors. |
| [`03-design-and-execution.md`](./03-design-and-execution.md) | Summarizes the shipped runtime split, source contract, cache basis, and retained v1 limits. |

## Primary Source Trail

- Roadmap and lifecycle procedure:
  - [`docs/ai-integration.md`](../../ai-integration.md)
  - [`docs/ai-integration/procedure.md`](../../procedure.md)
- Recon and workflow mapping:
  - [`docs/platform-recon.md`](../../../platform-recon.md)
  - [`docs/feature-mapping.md`](../../../feature-mapping.md)
- Reviewer UI and current contracts:
  - `frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx`
  - `frontend/components/reviewer/submission-review.tsx`
  - `frontend/components/reviewer/submission-review/review-sidebar.tsx`
  - `frontend/hooks/use-assignment-review.ts`
  - `frontend/lib/api/reviews.ts`
- Backend compatibility boundary:
  - `backend/cmd/server/main.go`
  - `backend/internal/storage/reviewer/reviewer.go`
  - `backend/internal/controller/submission/submission.go`
  - `backend/internal/model/submission.go`
- `ai-service` target boundary:
  - `ai-service/app/main.py`
  - `ai-service/app/db/models.py`
  - `ai-service/app/workflows/reviewer_pre_read_briefing/*`
  - `ai-service/app/workflows/submission_gating/router.py`
  - `ai-service/app/workflows/submission_gating/runner.py`
- Working design:
  - [`docs/plans/2026-03-29-ai-003-reviewer-pre-read-briefing-design.md`](../../../plans/2026-03-29-ai-003-reviewer-pre-read-briefing-design.md)
- Implementation plan:
  - [`docs/plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md`](../../../plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md)

## Reading Order

1. Read [`01-spec-and-recon.md`](./01-spec-and-recon.md) to understand what AI-003 is supposed to do.
2. Read [`02-current-state-audit.md`](./02-current-state-audit.md) to see what already exists, what is reusable, and what is currently unsafe or mis-scoped.
3. Read [`03-design-and-execution.md`](./03-design-and-execution.md) for the shipped execution baseline.
4. Use the implementation plan as the historical execution checklist that produced the delivered feature: [`../../../plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md`](../../../plans/2026-03-30-ai-003-reviewer-pre-read-briefing-implementation-plan.md).
5. Use the main lifecycle record as the canonical shipped verdict and artifact index: [`../../AI-003-reviewer-pre-read-briefing.md`](../../AI-003-reviewer-pre-read-briefing.md).
