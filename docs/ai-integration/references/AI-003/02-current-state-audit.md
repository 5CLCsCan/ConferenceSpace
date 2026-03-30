# AI-003 Current-State Audit

## Reviewer UI Surface

- The current reviewer submission detail screen already renders the AI card in the right-side review sidebar beside the abstract and review form (`frontend/components/reviewer/submission-review.tsx:228-241`).
- The current card is `AIAssistantCard` and is still local-state placeholder logic. It has:
  - a freeform `analysisInput`
  - a mock analyzing timer
  - a fake markdown result
  - no real backend integration (`frontend/components/reviewer/submission-review/review-sidebar.tsx:88-340`).
- Inference: the correct UI placement already exists, but the current interaction model is wrong for a reusable workflow artifact because it behaves like ad hoc prompt-driven assistance.

## Reviewer Assignment Context

- The reviewer assignment page already resolves `assignment_id -> conference_id -> submission_id` before rendering the review screen by using:
  - `resolveAssignmentConference(...)`
  - `getAssignmentReview(...)`
  - `getPaperById(...)` (`frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx:49-99`).
- This means AI-003 should not create a second browser-side context resolution path. The browser already has a stable assignment-centric shell.
- Current review data loading is assignment-scoped through `useAssignmentReview()` and `GET /api/v1/conferences/{conference_id}/assignments/{assignment_id}/review` (`frontend/hooks/use-assignment-review.ts:17-33`, `frontend/lib/api/reviews.ts:151-188`).

## Manuscript Storage And Reviewer Data

- Reviewer assignment queries already include manuscript file metadata such as `file_path`, `file_original_name`, `file_size`, and `file_mime_type` (`backend/internal/storage/reviewer/reviewer.go:994-998`).
- Submission storage already persists manuscript file metadata in the source-of-truth submission model (`backend/internal/model/submission.go:41-56`).
- Inference: the current system already knows which manuscript file belongs to the assigned submission. AI-003 does not need a new document registry.

## Current Reviewer File-Access Risk

- The current submission file controller only checks authentication and conference or submission existence before streaming the file (`backend/internal/controller/submission/submission.go:840-883`).
- It does not verify that the requester is the assigned reviewer for the submission.
- Inference: AI-003 must not rely on `submission.GetFile` as its reviewer-safe manuscript boundary. A stricter assignment-owned path is required.

## AI-Service Boundary

- `ai-service` already mounts isolated workflow routers through the AI-002 pattern (`ai-service/app/main.py:20-21`).
- AI-002 also already has document extraction precedent for PDF, DOCX, and LaTeX through submission gating (`ai-service/app/workflows/submission_gating/runner.py:52-55`, `ai-service/app/workflows/submission_gating/models/facts.py:33-48`).
- AI-003 already exists partially in `ai-service` with router, runner, schemas, persistence models, migration, and tests (`ai-service/app/main.py:20-21`, `ai-service/app/db/models.py:174-240`, `ai-service/alembic/versions/20260330_0004_reviewer_briefing_tables.py:1-104`).
- However, the current AI-003 source model is wrong for the corrected product. It still centers `paper_snapshot`, `discussion_context`, and `rebuttal_context` instead of actual manuscript ingestion (`ai-service/app/workflows/reviewer_pre_read_briefing/schemas.py:23-76`, `ai-service/app/workflows/reviewer_pre_read_briefing/runner.py:136-174`).

## Current Cache And Version Mismatch

- The earlier AI-003 design and partial implementation both use `submission_version`.
- The backend source-of-truth submission model does not have a first-class `submission_version` field (`backend/internal/model/submission.go:32-62`, `backend/internal/dto/submission.go:31-53`).
- Inference: the corrected AI-003 cache key must be built from real submission state markers rather than a nonexistent version field.
