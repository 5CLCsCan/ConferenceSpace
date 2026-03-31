# AI-010 Reference Index

## Purpose

This folder is the curated navigation layer for AI-010. The main lifecycle record remains [`AI-010-review-quality-consistency-auditor.md`](../../AI-010-review-quality-consistency-auditor.md); this index points readers to the roadmap entry, corrected planning package, and shipped implementation anchors that matter for the current semantic-audit baseline.

## Primary Source Trail

- Roadmap and lifecycle procedure:
  - [`docs/ai-integration.md`](../../ai-integration.md)
  - [`docs/ai-integration/procedure.md`](../../procedure.md)
- AI-010 planning package:
  - [`docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-discovery.md`](../../../plans/2026-03-31-ai-010-review-quality-consistency-auditor-discovery.md)
  - [`docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-design.md`](../../../plans/2026-03-31-ai-010-review-quality-consistency-auditor-design.md)
  - [`docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-prd.md`](../../../plans/2026-03-31-ai-010-review-quality-consistency-auditor-prd.md)
  - [`docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor-implementation-spec.md`](../../../plans/2026-03-31-ai-010-review-quality-consistency-auditor-implementation-spec.md)
  - [`docs/plans/2026-03-31-ai-010-review-quality-consistency-auditor.md`](../../../plans/2026-03-31-ai-010-review-quality-consistency-auditor.md)
- Reviewer workflow anchors:
  - `frontend/components/reviewer/submission-review.tsx`
  - `frontend/components/reviewer/submission-review/review-audit-panel.tsx`
  - `frontend/hooks/use-review-audit.ts`
  - `frontend/lib/api/review-audit.ts`
- Backend enforcement and persistence:
  - `backend/internal/controller/assignment/review_audit.go`
  - `backend/internal/controller/assignment/assignment.go`
  - `backend/internal/storage/assignment/review_audit.go`
  - `backend/migrations/000039_add_review_audit_state.up.sql`
- `ai-service` workflow and persistence:
  - `ai-service/app/workflows/review_quality_auditor/prompts.py`
  - `ai-service/app/workflows/review_quality_auditor/runner.py`
  - `ai-service/app/workflows/review_quality_auditor/schemas.py`
  - `ai-service/app/workflows/review_quality_auditor/router.py`
  - `ai-service/app/repositories/review_quality_audit_repo.py`
  - `ai-service/alembic/versions/20260331_0006_review_quality_audit_runs.py`
- Optional AI-003 dependency boundary:
  - [`../../AI-003-reviewer-pre-read-briefing.md`](../../AI-003-reviewer-pre-read-briefing.md)
  - `backend/internal/controller/assignment/briefing.go`
  - `ai-service/app/workflows/reviewer_pre_read_briefing/*`

## Reading Order

1. Read the main lifecycle record first: [`../../AI-010-review-quality-consistency-auditor.md`](../../AI-010-review-quality-consistency-auditor.md).
2. Read the design and PRD to understand the corrected boundary between structural validation and semantic audit:
   - [`../../../plans/2026-03-31-ai-010-review-quality-consistency-auditor-design.md`](../../../plans/2026-03-31-ai-010-review-quality-consistency-auditor-design.md)
   - [`../../../plans/2026-03-31-ai-010-review-quality-consistency-auditor-prd.md`](../../../plans/2026-03-31-ai-010-review-quality-consistency-auditor-prd.md)
3. Read the shipped workflow files for implementation truth:
   - reviewer UI
   - backend enforcement
   - `ai-service` prompt, schema, and runner
4. Use the AI-003 lifecycle record only for the optional additional-material boundary; AI-010 must not inherit AI-003 authority over recommendation or score.
