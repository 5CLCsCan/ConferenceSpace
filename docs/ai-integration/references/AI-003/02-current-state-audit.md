# AI-003 Current-State Audit

## Reviewer UI Surface

- The reviewer submission detail screen now renders AI-003 as a real sidebar card in the right-side review sidebar beside the abstract and review form.
- The card is no longer a prompt-driven placeholder. It now:
  - looks up existing artifact state on load
  - exposes `Start generating` when no artifact exists
  - opens a typed modal analysis view when the artifact is ready
  - renders structured sections rather than raw markdown output
- Inference: the intended UI placement survived unchanged, but the interaction model is now a real workflow artifact instead of ad hoc assistance.

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

## Reviewer File-Access Boundary

- AI-003 now uses an assignment-scoped backend controller path rather than the generic submission file controller as its ingestion boundary.
- Reviewer assignment ownership is checked before manuscript loading or generation.
- Inference: the earlier reviewer file-access blocker was resolved at the AI-003 controller boundary without weakening the generic submission-file route assumptions elsewhere.

## AI-Service Boundary

- `ai-service` now mounts AI-003 as a real isolated workflow with router, runner, prompt contract, schemas, repository, persistence tables, and tests.
- AI-003 now consumes reviewer-visible submission metadata plus manuscript-backed input rather than discussion or rebuttal context.
- The workflow persists artifacts and run records keyed by `submission_state_fingerprint`.
- The current implementation also includes typed `review_readiness_signals` support and fallback signal construction when the model returns no usable signal list.

## Current Cache And Version Basis

- AI-003 no longer relies on `submission_version`.
- The backend now computes a real `submission_state_fingerprint` from reviewer-visible submission state and manuscript file metadata before proxying into `ai-service`.
- Inference: the earlier version-model mismatch was resolved by moving to a real submission-state marker.
