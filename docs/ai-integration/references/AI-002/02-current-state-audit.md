# AI-002 Current-State Audit

## Frontend Advisory Flow

- `precheckPaper()` sends only `file` to `POST /api/v1/conferences/{conference_id}/submissions/precheck` and expects the backend to respond with the legacy `PrecheckResult` shape (`frontend/lib/api/papers.ts:424-476`, `frontend/lib/types.ts:18-47`).
- `FileUploadStep` runs that precheck automatically after a PDF upload, shows loading and error states, and renders `PreCheckResults` when a report is returned (`frontend/components/author/submit/file-upload-step.tsx:46-83`, `frontend/components/author/submit/file-upload-step.tsx:213-232`, `frontend/components/author/submit/file-upload-step.tsx:301-358`).
- `PaperSubmissionForm` already understands `PRECHECK_BLOCKED`, distinguishes draft save from publish, and allows final submit only when precheck passed locally or a server-side fallback is possible (`frontend/components/author/submit/paper-submission-form.tsx:149-157`, `frontend/components/author/submit/paper-submission-form.tsx:225-297`, `frontend/components/author/submit/paper-submission-form.tsx:519-583`, `frontend/components/author/submit/paper-submission-form.tsx:793-804`).

## Submission Metadata And Policy Surfaces

- Submission create/update payloads already carry title, abstract, track, keywords, co-authors, declared conflicts, paper type, track name, and metadata such as language and page count (`frontend/lib/api/papers.ts:30-114`, `frontend/components/author/submit/paper-submission-form.tsx:178-205`, `backend/internal/utils/submission_binder.go:19-46`, `backend/internal/utils/submission_binder.go:111-155`).
- Conference configuration DTOs persist `maximum_pages`, `submission_format`, `review_type`, `desk_rejection_settings`, and `workflow_settings.strict_deadlines`, which are enough to build a policy snapshot even though some UI mappings are awkward (`backend/internal/dto/conference.go:18-73`, `frontend/lib/types.ts:118-170`).
- The chair wizard exposes `PDF`, `LaTeX`, and `Word`, but those UI options do not match the backend file-storage truth for paper uploads (`frontend/components/wizard/creation/steps/policy-guidelines.tsx:15-27`, `backend/internal/storage/file/file.go:39-49`).
- Policy persistence is not cleanly modeled everywhere. The conference form maps `minKeywords` into `min_references`, supplementary allowance into `custom_rules.min_datasets`, and persists strict deadlines even though the checkbox is unwired in the wizard (`frontend/lib/conference-form.ts:351-410`, `frontend/components/wizard/creation/steps/topics-deadlines.tsx:367-389`).

## Backend Enforcement And File Truth

- The current Go precheck endpoint loads the conference, converts config into `PaperRuleConfig`, runs the desk-rejection pipeline, and returns the report without DB storage (`backend/internal/controller/submission/precheck.go:65-86`).
- A hard-gate helper already exists and maps any non-`accept_for_review` decision into `PRECHECK_BLOCKED`, but the create/publish controllers currently disable the hard-gate calls (`backend/internal/controller/submission/precheck_gate.go:33-62`, `backend/internal/controller/submission/submission.go:168-174`, `backend/internal/controller/submission/submission.go:624-625`).
- Backend paper-file storage is already strict: main submission files and camera-ready files must be PDF, have the correct MIME type and `.pdf` extension, be at most 20 MB, and start with `%PDF-` (`backend/internal/storage/file/file.go:39-49`, `backend/internal/storage/file/file.go:103-151`, `backend/internal/storage/file/file.go:237-241`).

## Desk-Rejection Subsystem Limits

- The current desk-rejection subsystem is modular and already shaped like `extract -> check -> aggregate`, but it is still advisory-only and uses the legacy report model (`backend/internal/deskrejection/README.md:7-33`, `backend/internal/deskrejection/models/models.go:81-127`, `backend/internal/deskrejection/pipeline/pipeline.go:17-21`).
- It can append Gemini-based evaluation results when a `gemini_client` is present in context, so it cannot serve as AI-002 unchanged because that would violate deterministic verdict requirements (`backend/internal/controller/submission/precheck.go:74-80`, `backend/internal/deskrejection/pipeline/pipeline.go:86-99`).
- Its extraction stack is also tied to Go-side `pdftotext` / `ledongthuc/pdf`, not the Python workflow stack targeted for `ai-service` (`backend/internal/deskrejection/README.md:114-120`, `backend/internal/deskrejection/extractor/backends.go:13-20`, `backend/internal/deskrejection/extractor/backends.go:81-103`).

## AI-Service Boundary

- `ai-service` currently mounts only `status_router` and `agent_router`, and its persisted tables are limited to AI-001 session, message, and tool audit state (`ai-service/app/main.py:89-97`, `ai-service/app/api/routes.py:32-53`, `ai-service/app/db/models.py:29-116`).
- Its current dependencies do not include PDF extraction, rule execution, or templating libraries for AI-002 yet (`ai-service/pyproject.toml:9-22`).
- Inference: `ai-service/app/workflows/` has no shipped workflow code today, so AI-002 must add its own routing and persistence primitives rather than filling in an existing workflow module.

## Chair Configuration Gap

- The Go backend already defines `DeskRejectionSettings` with rule-oriented fields (`enabled`, `min_references`, `required_sections`, `title_max_words`, `scope_keywords`, `banned_phrases`, `custom_rules`) and an LLM steering surface (`prompt_fragments []string`), but none of these fields are surfaced in the conference creation wizard (`backend/internal/dto/conference.go:5-29`, `frontend/components/wizard/creation/steps/policy-guidelines.tsx`).
- The wizard's Step 3 (Policy & Guidelines) only exposes page limits, keywords, file formats, review type, and supplementary materials. There is no `WizardFormCard` for submission gating or content steering (`frontend/components/wizard/creation/types.ts:34-41`, `frontend/components/wizard/creation/steps/policy-guidelines.tsx:83-388`).
- `ConferenceFormData` in `types.ts` has no fields for `submissionGatingEnabled`, `minReferences`, `requiredSections`, `steeringPrompt`, or any other `DeskRejectionSettings` sub-field (`frontend/components/wizard/creation/types.ts:34-74`).
- The `conference-form.ts` serialization layer must be extended to map the new wizard fields into `configurations.desk_rejection_settings` before the conference create/update payload is sent (`frontend/lib/conference-form.ts`).

