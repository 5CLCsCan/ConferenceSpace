# AI-002 Submission Material Gating Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement AI-002 end-to-end across `ai-service`, the Go backend, and the conference creation wizard while keeping the browser contract unchanged and all hard verdicts deterministic.

**Architecture:** The Go backend becomes a compatibility and enforcement proxy in front of a new isolated `ai-service` workflow. The workflow owns extraction, fact derivation, deterministic rule evaluation, advisory LLM content evaluation, verdict mapping, guidance rendering, and persistence. The wizard writes chair-configured gating settings into `desk_rejection_settings`, which Go forwards to `ai-service`.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, `pypdf`, `pdfplumber`, `python-docx`, `TexSoup`, `python-magic`, `rule-engine`, `Jinja2`, `RapidFuzz`, Go 1.24, Gin, Next.js 15, Vitest.

---

### Task 1: Save failing ai-service tests for the workflow contract

**Files:**
- Create: `ai-service/tests/test_submission_gating_models.py`
- Create: `ai-service/tests/test_submission_gating_stages.py`
- Create: `ai-service/tests/test_submission_gating_runner.py`
- Create: `ai-service/tests/test_submission_gating_routes.py`

**Step 1: Write failing tests for stage outputs and skip behavior**

Cover:
- unsupported format blocks in `binary_integrity`
- encrypted PDF blocks with an integrity finding
- disabled gating skips `policy_evaluation` and `content_evaluation`
- LLM timeout leaves `content_findings` empty and continues
- `min_references` rule blocks when references are insufficient

**Step 2: Run the focused ai-service tests and confirm they fail for the expected missing workflow code**

Run: `cd ai-service; .\.venv\Scripts\python -m pytest tests/test_submission_gating_models.py tests/test_submission_gating_stages.py tests/test_submission_gating_runner.py tests/test_submission_gating_routes.py -q`

Expected: import or assertion failures referencing missing AI-002 modules or behavior.

---

### Task 2: Implement ai-service schema, models, extractors, and stage modules

**Files:**
- Modify: `ai-service/pyproject.toml`
- Modify: `ai-service/app/db/models.py`
- Create: `ai-service/app/repositories/gating_run_repo.py`
- Create: `ai-service/app/workflows/submission_gating/__init__.py`
- Create: `ai-service/app/workflows/submission_gating/router.py`
- Create: `ai-service/app/workflows/submission_gating/schemas.py`
- Create: `ai-service/app/workflows/submission_gating/runner.py`
- Create: `ai-service/app/workflows/submission_gating/models/__init__.py`
- Create: `ai-service/app/workflows/submission_gating/models/state.py`
- Create: `ai-service/app/workflows/submission_gating/models/facts.py`
- Create: `ai-service/app/workflows/submission_gating/models/findings.py`
- Create: `ai-service/app/workflows/submission_gating/models/policy.py`
- Create: `ai-service/app/workflows/submission_gating/extractors/__init__.py`
- Create: `ai-service/app/workflows/submission_gating/extractors/pdf_extractor.py`
- Create: `ai-service/app/workflows/submission_gating/extractors/docx_extractor.py`
- Create: `ai-service/app/workflows/submission_gating/extractors/latex_extractor.py`
- Create: `ai-service/app/workflows/submission_gating/stages/__init__.py`
- Create: `ai-service/app/workflows/submission_gating/stages/intake_normalization.py`
- Create: `ai-service/app/workflows/submission_gating/stages/binary_integrity.py`
- Create: `ai-service/app/workflows/submission_gating/stages/document_extraction.py`
- Create: `ai-service/app/workflows/submission_gating/stages/fact_derivation.py`
- Create: `ai-service/app/workflows/submission_gating/stages/content_evaluation.py`
- Create: `ai-service/app/workflows/submission_gating/stages/policy_evaluation.py`
- Create: `ai-service/app/workflows/submission_gating/stages/verdict_mapping.py`
- Create: `ai-service/app/workflows/submission_gating/stages/guidance_rendering.py`
- Create: `ai-service/app/workflows/submission_gating/stages/persistence_audit.py`
- Create: `ai-service/app/workflows/submission_gating/rules/__init__.py`
- Create: `ai-service/app/workflows/submission_gating/rules/engine.py`
- Create: `ai-service/app/workflows/submission_gating/rules/templates/guidance.j2`

**Step 1: Implement minimal models and schemas to satisfy imports**

Create the state envelope, facts, findings, policy snapshot, and request/response Pydantic models with only the fields required by the spec.

**Step 2: Implement extractors and deterministic stages in the smallest passing increments**

Start with:
- `intake_normalization`
- `binary_integrity`
- `document_extraction`
- `fact_derivation`
- `policy_evaluation`
- `verdict_mapping`
- `guidance_rendering`

Then add:
- `content_evaluation` with warn-only parsing and timeout-safe fallback
- `persistence_audit`

**Step 3: Re-run the focused ai-service tests until green**

Run: `cd ai-service; .\.venv\Scripts\python -m pytest tests/test_submission_gating_models.py tests/test_submission_gating_stages.py tests/test_submission_gating_runner.py tests/test_submission_gating_routes.py -q`

---

### Task 3: Add ai-service persistence and route mounting

**Files:**
- Create: `ai-service/alembic/versions/20260315_0003_submission_material_gating_tables.py`
- Modify: `ai-service/app/main.py`

**Step 1: Write the Alembic migration for `gating_runs` and `gating_stage_records`**

Use AI-002-only tables under the existing `ai` schema with no foreign keys to AI-001 tables.

**Step 2: Mount the workflow router in `main.py` without touching `agent_router`**

Append the new router to the app after existing routes.

**Step 3: Run migration and workflow route tests**

Run:
- `cd ai-service; .\.venv\Scripts\python -m alembic upgrade head`
- `cd ai-service; .\.venv\Scripts\python -m pytest tests/test_submission_gating_routes.py -q`

---

### Task 4: Write failing backend tests for adapter behavior and expanded upload formats

**Files:**
- Modify: `backend/tests/api/submission/precheck_file_reviews_test.go`
- Modify: `backend/tests/api/submission/submission_test.go`
- Modify: `backend/tests/api/submission/client.go`
- Create: `backend/tests/api/submission/precheck_adapter_test.go`

**Step 1: Add tests that describe the new behavior before implementation**

Cover:
- precheck route accepts `.docx` and `.tex`
- adapter maps AI-service `pass`, `warn`, `block` into legacy advisory response
- gate-mode publish/create rejects with `PRECHECK_BLOCKED` on AI-service `block`
- legacy desk-rejection pipeline is not invoked by the new route

**Step 2: Run focused backend tests and confirm expected failures**

Run: `cd backend; go test ./tests/api/submission -run 'Precheck|Submission' -count=1`

---

### Task 5: Implement Go proxy adapter and file-storage expansion

**Files:**
- Modify: `backend/internal/controller/submission/precheck.go`
- Modify: `backend/internal/controller/submission/precheck_gate.go`
- Modify: `backend/internal/controller/submission/submission.go`
- Modify: `backend/internal/storage/file/file.go`
- Modify: `backend/internal/dto/submission.go`
- Modify: `backend/internal/dto/conference.go` if helper DTOs are needed

**Step 1: Replace legacy precheck execution with AI-service proxying**

Build enriched multipart request using:
- conference configuration
- actor identity
- submission metadata when available
- uploaded file bytes

Map AI-service response back into the current `PrecheckResult`/`PRECHECK_BLOCKED` shapes.

**Step 2: Re-enable gate-mode create/publish enforcement**

Use the same AI-service path in `gate` mode for:
- create with `published`
- publish-from-draft

**Step 3: Expand paper upload validation to allow `.pdf`, `.docx`, and `.tex`**

Keep camera-ready PDF-only and cover-letter rules unchanged unless already broader.

**Step 4: Run focused backend tests until green**

Run: `cd backend; go test ./tests/api/submission -run 'Precheck|Submission' -count=1`

---

### Task 6: Write failing frontend tests for wizard serialization and UI

**Files:**
- Modify: `frontend/lib/api/__tests__/papers.test.ts`
- Create: `frontend/lib/__tests__/conference-form.test.ts`
- Create: `frontend/components/wizard/creation/__tests__/policy-guidelines.test.tsx`

**Step 1: Add tests that assert the new wizard fields serialize into `desk_rejection_settings`**

Cover:
- enable toggle
- deterministic rules
- `steeringPrompt` becomes `prompt_fragments`
- field visibility toggles with the master enable switch

**Step 2: Run the focused frontend tests and confirm expected failures**

Run: `cd frontend; npm run test:run -- papers.test.ts conference-form.test.ts policy-guidelines.test.tsx`

---

### Task 7: Implement frontend wizard wiring

**Files:**
- Modify: `frontend/components/wizard/creation/types.ts`
- Modify: `frontend/components/wizard/creation/steps/policy-guidelines.tsx`
- Modify: `frontend/lib/conference-form.ts`
- Modify: `frontend/lib/types.ts` if needed for stronger desk-rejection typing

**Step 1: Extend `ConferenceFormData` and defaults with AI-002 gating fields**

Add:
- `submissionGatingEnabled`
- `minReferences`
- `requiredSections`
- `titleMaxWords`
- `authorAnonymizationRequired`
- `bannedPhrases`
- `scopeKeywords`
- `steeringPrompt`

**Step 2: Add the Submission Gating `WizardFormCard` to Step 3**

Show rule inputs only when enabled. Enforce `2000` char limit on the steering prompt.

**Step 3: Serialize the new fields into `configurations.desk_rejection_settings`**

Store `steeringPrompt` as a single-element `prompt_fragments` array when non-empty.

**Step 4: Re-run the focused frontend tests until green**

Run: `cd frontend; npm run test:run -- papers.test.ts conference-form.test.ts policy-guidelines.test.tsx`

---

### Task 8: Full verification

**Step 1: Run ai-service verification**

Run:
- `cd ai-service; .\.venv\Scripts\python -m pytest -q`

**Step 2: Run backend verification**

Run:
- `cd backend; go test ./tests/api/submission -count=1`

**Step 3: Run frontend verification**

Run:
- `cd frontend; npm run test:run`

**Step 4: Manual checks**

Verify:
- PDF, DOCX, and LaTeX precheck runs return `pass`, `warn`, or `block` plus findings and guidance
- encrypted PDF blocks at `binary_integrity`
- gating disabled returns `pass` with a disabled note and skips LLM/policy stages
- steering prompt produces `llm_content_evaluation` findings without ever blocking
