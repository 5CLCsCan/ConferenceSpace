# AI-006 Reference Index

## Purpose

This folder is the curated navigation layer for AI-006. The main lifecycle record remains [`AI-006-chair-decision-copilot.md`](../../AI-006-chair-decision-copilot.md); these notes point readers to the roadmap scope, current chair workflow anchors, and the final planning package that defines the implementation-ready baseline.

## Reference Notes

| Note | Role |
| ---- | ---- |
| [`01-spec-and-recon.md`](./01-spec-and-recon.md) | Restates AI-006 as evidence synthesis and locks the advisory-only product boundary. |
| [`02-current-state-audit.md`](./02-current-state-audit.md) | Maps the current chair submission runtime, review analytics, rebuttal signals, and workflow gaps. |
| [`03-design-and-planning.md`](./03-design-and-planning.md) | Summarizes the accepted runtime split, persistence model, lifecycle rules, and planning artifacts. |

## Primary Source Trail

- Roadmap and lifecycle procedure:
  - [`docs/ai-integration.md`](../../ai-integration.md)
  - [`docs/ai-integration/procedure.md`](../../procedure.md)
- Recon and workflow mapping:
  - [`docs/platform-recon.md`](../../../platform-recon.md)
- Chair submission runtime:
  - `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx`
  - `frontend/components/chair/conference-detail/submission-detail-content.tsx`
  - `frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx`
  - `frontend/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`
- Current analytics and rebuttal contracts:
  - `frontend/lib/api/reviews.ts`
  - `frontend/lib/api/rebuttal.ts`
  - `frontend/components/chair/submission-analytics.tsx`
- Workflow precedent:
  - `backend/internal/controller/assignment/briefing.go`
  - `ai-service/app/workflows/reviewer_pre_read_briefing/*`
  - `ai-service/app/repositories/reviewer_briefing_repo.py`
- Final planning package:
  - [`docs/plans/2026-03-31-ai-006-chair-decision-copilot-discovery.md`](../../../plans/2026-03-31-ai-006-chair-decision-copilot-discovery.md)
  - [`docs/plans/2026-03-31-ai-006-chair-decision-copilot-design.md`](../../../plans/2026-03-31-ai-006-chair-decision-copilot-design.md)
  - [`docs/plans/2026-03-31-ai-006-chair-decision-copilot-prd.md`](../../../plans/2026-03-31-ai-006-chair-decision-copilot-prd.md)
  - [`docs/plans/2026-03-31-ai-006-chair-decision-copilot-implementation-spec.md`](../../../plans/2026-03-31-ai-006-chair-decision-copilot-implementation-spec.md)
  - [`docs/plans/2026-03-31-ai-006-chair-decision-copilot.md`](../../../plans/2026-03-31-ai-006-chair-decision-copilot.md)

## Reading Order

1. Read [`01-spec-and-recon.md`](./01-spec-and-recon.md) to understand what AI-006 is supposed to do.
2. Read [`02-current-state-audit.md`](./02-current-state-audit.md) to see what already exists and what is still missing.
3. Read [`03-design-and-planning.md`](./03-design-and-planning.md) for the accepted runtime shape and planning handoff.
4. Use the main lifecycle record as the canonical verdict and artifact index: [`../../AI-006-chair-decision-copilot.md`](../../AI-006-chair-decision-copilot.md).
