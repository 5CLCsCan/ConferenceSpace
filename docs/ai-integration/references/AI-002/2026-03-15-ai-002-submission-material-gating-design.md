# AI-002 Submission Material Gating Design

**Date:** 2026-03-15
**Goal:** Ship AI-002 as an isolated `ai-service` workflow that deterministically validates uploaded submission materials, persists every run, optionally adds advisory LLM content findings, and keeps the browser-facing precheck contract stable through a Go proxy adapter.

---

## Scope

AI-002 replaces the current Go desk-rejection precheck path for all new execution paths. The browser continues to call `POST /api/v1/conferences/{conference_id}/submissions/precheck` with only a file. The Go backend enriches that request with conference policy, actor identity, and submission metadata, then forwards it to `ai-service`.

V1 supports:
- `PDF`, `DOCX`, and `LaTeX` (`.tex`) submissions
- deterministic hard verdicts: `pass | warn | block`
- advisory-only LLM content findings sourced from `desk_rejection_settings.prompt_fragments`
- workflow persistence in AI-002-specific tables only
- unchanged AI-001 routes and tables

Out of scope for v1:
- OCR
- GROBID or any sidecar parser
- frontend direct calls to `ai-service`
- reuse of legacy Go desk-rejection pipeline logic

---

## Architecture

### AI-Service

Add a new `app/workflows/submission_gating/` package containing:
- `router.py` for `POST /runs` and `GET /runs/{run_id}`
- `schemas.py` for request/response transport models
- `runner.py` for stage sequencing, timing, state transitions, and persistence
- `models/` for `GatingState`, facts, findings, verdict, and policy snapshots
- `extractors/` for `pdf`, `docx`, and `latex`
- `stages/` for the nine pipeline stages
- `rules/engine.py` and `rules/templates/guidance.j2`

Persistence is added to `app/db/models.py` and `app/repositories/gating_run_repo.py` with separate `gating_runs` and `gating_stage_records` tables.

### Go Backend

The current precheck controller becomes a proxy adapter:
- remove `PaperRuleConfig` conversion and any `backend/internal/deskrejection/**` invocation
- load conference policy from existing storage
- load actor identity from auth context
- include submission metadata when available for publish/create flows
- call `ai-service` workflow routes
- map canonical AI-002 output back into the current frontend-facing `PrecheckResult` or `PRECHECK_BLOCKED` shape

Create-as-published and publish-from-draft flows re-enable the hard gate by calling the same workflow in `gate` mode.

### Frontend

Step 3 of the conference wizard gets a new Submission Gating `WizardFormCard`:
- enable toggle
- min references
- required sections
- title max words
- anonymization toggle
- banned phrases
- scope keywords
- steering prompt textarea with `2000` character limit

`ConferenceFormData` and `frontend/lib/conference-form.ts` serialize these values into `configurations.desk_rejection_settings`, including `prompt_fragments`.

---

## Data Flow

1. Browser uploads file to Go precheck route.
2. Go loads conference configuration and actor context.
3. Go builds AI-002 multipart payload: JSON `request` + binary `file`.
4. `ai-service` runs:
   - `intake_normalization`
   - `binary_integrity`
   - `document_extraction`
   - `fact_derivation`
   - `content_evaluation`
   - `policy_evaluation`
   - `verdict_mapping`
   - `guidance_rendering`
   - `persistence_audit`
5. `ai-service` persists `gating_runs` and `gating_stage_records`.
6. Go maps the response into either:
   - advisory precheck response for the current frontend
   - `PRECHECK_BLOCKED` on gate-mode block

---

## Determinism Rules

- `binary_integrity`, `document_extraction`, `fact_derivation`, `policy_evaluation`, `verdict_mapping`, and `guidance_rendering` are deterministic.
- `content_evaluation` is the only nondeterministic stage.
- LLM output is tagged `source: "llm_content_evaluation"`.
- LLM output can contribute `warn` findings only.
- LLM failures never halt the workflow and never cause `block`.

---

## Testing Strategy

### AI-Service

- unit tests for all nine stages
- extractor tests using small fixture bytes or stubs
- route integration tests with real DB session writes
- runner tests for state transitions, skip behavior, and persisted stage timings

### Backend

- adapter tests for advisory `pass`, `warn`, `block`
- gate-mode tests for blocked create/publish
- storage tests for `.docx` and `.tex` paper acceptance
- regression tests proving no new code path calls `backend/internal/deskrejection/`

### Frontend

- serialization tests for `conference-form.ts`
- API mapping tests if needed
- component tests for Step 3 Submission Gating card behavior

---

## Risks

- Windows `python-magic` support may depend on bundled `libmagic` behavior; integration tests must use actual installed environment behavior rather than assuming Linux semantics.
- DOCX page count is estimated, not authoritative.
- Existing frontend `PrecheckResult` shape uses legacy field names, so mapping must remain explicit and reversible until the frontend types are upgraded.
- Large cross-service scope makes partial completion risky; verification must be run per subsystem before any success claim.
