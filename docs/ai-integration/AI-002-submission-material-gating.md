# AI-002 Submission Material Gating

## Overview

- Roadmap entry: [`docs/ai-integration.md`](../ai-integration.md)
- Canonical procedure: [`docs/ai-integration/procedure.md`](./procedure.md)
- Curated references:
  - [`references/AI-002/00-index.md`](./references/AI-002/00-index.md)
  - [`references/AI-002/01-spec-and-recon.md`](./references/AI-002/01-spec-and-recon.md)
  - [`references/AI-002/02-current-state-audit.md`](./references/AI-002/02-current-state-audit.md)
  - [`references/AI-002/03-tooling-research.md`](./references/AI-002/03-tooling-research.md)
  - [`references/AI-002/04-pipeline-design.md`](./references/AI-002/04-pipeline-design.md)
- Last reviewed: 2026-03-14

## Verdict

- Verdict: `needs work`
- Rationale: The roadmap calls for a deterministic AI workflow that gates submission materials before review intake and returns `pass | warn | block` with remediation guidance, but the shipped system still consists of an advisory frontend precheck plus a Go desk-rejection endpoint that returns legacy `accept_for_review | manual_review | desk_reject`, stores nothing, can append Gemini-based results, and has its hard-gate call sites explicitly disabled in create/publish flows (`docs/ai-integration.md:53-73`, `frontend/lib/api/papers.ts:424-476`, `backend/internal/controller/submission/precheck.go:71-86`, `backend/internal/deskrejection/pipeline/pipeline.go:86-99`, `backend/internal/controller/submission/submission.go:168-174`, `backend/internal/controller/submission/submission.go:624-625`).
- Scope note: This record locks the AI-002 v1 design as an isolated `ai-service` workflow. The legacy Go precheck implementation (desk-rejection pipeline, `PaperRuleConfig` conversion, optional Gemini evaluation) is marked for removal; the Go backend retains the existing frontend-facing endpoint as a proxy that enriches the request and forwards it to `ai-service`, avoiding a frontend-to-ai-service round-trip. AI-001 infrastructure may be reused only at the shared-service level such as auth, DB, Redis, and common clients (`frontend/components/author/submit/file-upload-step.tsx:46-83`, `ai-service/app/main.py:43-60`, `ai-service/app/api/routes.py:32-53`).

## Lifecycle Status

| State       | Status      | Notes / Linked Artifact |
| ----------- | ----------- | ----------------------- |
| `create`    | complete    | This lifecycle record and its curated reference set establish the canonical AI-002 baseline. |
| `research`  | complete    | Roadmap, recon, current implementation surfaces, and dependency research are normalized in [`01-spec-and-recon.md`](./references/AI-002/01-spec-and-recon.md), [`02-current-state-audit.md`](./references/AI-002/02-current-state-audit.md), and [`03-tooling-research.md`](./references/AI-002/03-tooling-research.md). |
| `design`    | complete    | The deterministic pipeline, contracts, isolation boundary, and stage map are locked in [`04-pipeline-design.md`](./references/AI-002/04-pipeline-design.md). |
| `plan`      | complete    | This document includes an implementation-start checklist and explicit target contracts so implementation can begin without additional architectural discovery. |
| `implement` | not started | No isolated AI-002 workflow router, state model, persistence schema, or PDF/rule/template dependency stack exists in `ai-service` today (`ai-service/app/main.py:95-96`, `ai-service/app/api/routes.py:32-53`, `ai-service/app/db/models.py:29-116`, `ai-service/pyproject.toml:9-22`). |
| `verify`    | partial     | Current-state evidence is verified against shipped code and official library sources, but no AI-002 implementation or execution tests exist yet (`backend/tests/api/submission/precheck_file_reviews_test.go:16-55`, `ai-service/tests`, [`references/AI-002/03-tooling-research.md`](./references/AI-002/03-tooling-research.md)). |
| `finalize`  | partial     | The design baseline is stable enough for implementation, but the feature verdict remains `needs work` until the workflow is shipped and enforced. |
| `supersede` | not started | No newer canonical AI-002 lifecycle record exists. |

## Artifact Index

| Artifact Type | Artifact | Purpose |
| ------------- | -------- | ------- |
| Roadmap / Spec | [`docs/ai-integration.md`](../ai-integration.md) | Defines the original AI-002 scope, trigger, inputs, outputs, and dependency on policy persistence plus enforcement hooks (`docs/ai-integration.md:53-73`). |
| Research | [`docs/platform-recon.md`](../platform-recon.md) | Captures author submission lifecycle, policy persistence gaps, and inferred governance risks that constrain AI-002 (`docs/platform-recon.md:94-109`, `docs/platform-recon.md:194-212`). |
| Research | [`docs/feature-mapping.md`](../feature-mapping.md) | Confirms that a manuscript precheck already exists in the author submission flow (`docs/feature-mapping.md:244-252`). |
| Design | [`docs/ai-integration/AI-002-submission-material-gating.md`](./AI-002-submission-material-gating.md) | Canonical AI-002 lifecycle record and implementation-ready design baseline. |
| Design | [`references/AI-002/04-pipeline-design.md`](./references/AI-002/04-pipeline-design.md) | Detailed stage map, state object, workflow contract, and adapter handshake. |
| Implementation Precursor | `frontend/lib/api/papers.ts`, `frontend/components/author/submit/*` | Shows the current advisory precheck UX, file-only API contract, draft/publish flows, and legacy decision model (`frontend/lib/api/papers.ts:424-476`, `frontend/components/author/submit/file-upload-step.tsx:46-83`, `frontend/components/author/submit/paper-submission-form.tsx:519-583`). |
| Implementation Precursor | `backend/internal/controller/submission/*`, `backend/internal/storage/file/file.go` | Shows the current precheck endpoint, disabled hard gate, publish/create hooks, and PDF-only backend truth (`backend/internal/controller/submission/precheck.go:21-86`, `backend/internal/controller/submission/precheck_gate.go:33-62`, `backend/internal/controller/submission/submission.go:168-174`, `backend/internal/controller/submission/submission.go:624-625`, `backend/internal/storage/file/file.go:39-151`). |
| Implementation Precursor | `backend/internal/deskrejection/**` | Shows the current modular desk-rejection subsystem, its legacy report model, and the optional Gemini branch that makes it unsuitable as the deterministic AI-002 engine (`backend/internal/deskrejection/README.md:7-33`, `backend/internal/deskrejection/pipeline/pipeline.go:86-99`). |
| Implementation Boundary | `ai-service/app/*`, `ai-service/pyproject.toml` | Confirms AI-002 must be added as a separate workflow surface because current `ai-service` only exposes AI-001 agent routers and tables (`ai-service/app/main.py:95-96`, `ai-service/app/api/routes.py:32-53`, `ai-service/app/db/models.py:29-116`, `ai-service/pyproject.toml:9-22`). |
| Verification | `backend/tests/api/submission/precheck_file_reviews_test.go`, `ai-service/tests` | Shows existing coverage is limited to current precheck endpoint validation and AI-001-oriented service tests (`backend/tests/api/submission/precheck_file_reviews_test.go:16-55`, `ai-service/tests`). |
| References | [`references/AI-002/00-index.md`](./references/AI-002/00-index.md) | Entry point for the AI-002 reference trail. |

## Architecture / Data Flow

### Current Advisory Flow

The current author-side precheck runs automatically when a PDF upload is selected in `FileUploadStep`, calling `precheckPaper(conferenceId, file)` and rendering a legacy `PrecheckResult` with `accept_for_review | manual_review | desk_reject` decisions in `PreCheckResults` (`frontend/components/author/submit/file-upload-step.tsx:46-83`, `frontend/components/author/submit/file-upload-step.tsx:301-358`, `frontend/components/author/submit/precheck-results.tsx:56-94`, `frontend/lib/types.ts:18-47`).

That API call sends only multipart `file` bytes to `POST /api/v1/conferences/{conference_id}/submissions/precheck`, not submission metadata or policy snapshot material (`frontend/lib/api/papers.ts:424-476`). On the backend, `PreCheck` loads the conference config, converts it into `PaperRuleConfig`, optionally injects `gemini_client`, runs the desk-rejection pipeline, and returns a `ComplianceReport` without storing anything (`backend/internal/controller/submission/precheck.go:65-86`).

### Current Enforcement Gap

The frontend already expects server-side blocking responses for final submission and publish flows through `PRECHECK_BLOCKED`, and it allows publish when either a local precheck approved the file or an existing stored file can be rechecked server-side (`frontend/lib/types.ts:57-61`, `frontend/components/author/submit/paper-submission-form.tsx:149-157`, `frontend/components/author/submit/paper-submission-form.tsx:519-583`, `frontend/components/author/submit/paper-submission-form.tsx:793-804`).

However, the Go create and publish controllers explicitly disable the hard-gate calls today, so formal enforcement is not active even though helper methods exist (`backend/internal/controller/submission/precheck_gate.go:33-62`, `backend/internal/controller/submission/submission.go:168-174`, `backend/internal/controller/submission/submission.go:624-625`).

### AI-002 v1 Runtime Shape

AI-002 v1 keeps the existing frontend-facing precheck endpoint unchanged but removes the legacy Go precheck logic (desk-rejection pipeline, `PaperRuleConfig` conversion, optional Gemini evaluation). The Go backend becomes a pure proxy: it enriches the file-only browser call with conference policy, actor identity, and submission metadata, then forwards the assembled request to a new isolated workflow router in `ai-service` and maps the response back to the current frontend contract. This keeps the data flow as `frontend -> go-backend -> ai-service -> go-backend -> frontend` and avoids a wasteful round-trip through the browser. The new workflow must not reuse AI-001 agent routes, AI-001 session/message/tool tables, or AI-001 prompt/tool state; it only reuses shared service infrastructure patterns such as auth, Redis, Postgres, and HTTP clients (`frontend/lib/api/papers.ts:424-476`, `ai-service/app/main.py:43-60`, `ai-service/app/main.py:95-96`, `ai-service/app/api/routes.py:32-53`, `ai-service/app/db/models.py:29-116`).

Inference: `ai-service/app/workflows/` is presently empty and no workflow router is mounted, so AI-002 must introduce both the workflow runtime surface and its own persistence model rather than plugging into an existing workflows framework.

### Deterministic Pipeline Map

No LLM may influence any stage that determines `pass`, `warn`, or `block`. The same file bytes, normalized submission metadata, and policy snapshot must always produce the same verdict.

| Stage | Input | Output | Notes |
| ----- | ----- | ------ | ----- |
| `intake_normalization` | multipart `request` JSON + uploaded file | `NormalizedRequest`, `PolicySnapshot`, `InputFingerprint` | Canonicalize actor, mode, source, submission metadata, file metadata, and policy fields; reject malformed or unsupported requests early. |
| `binary_integrity` | `NormalizedRequest`, file bytes | `FileFacts`, integrity findings | Detect file type via `python-magic`, enforce supported formats (PDF, DOCX, LaTeX), size limits, and format-specific integrity: PDF header/parseability/decryptability, DOCX zip structure and XML validity, LaTeX basic structural parseability. |
| `document_extraction` | validated file (PDF, DOCX, or LaTeX) | `ExtractedDocument` | Format-specific extraction: `pypdf`/`pdfplumber` for PDF metadata/page/text/layout; `python-docx` for DOCX paragraphs, heading styles, tables, and core properties; `TexSoup` for LaTeX structural commands (`\section`, `\title`, `\begin{abstract}`, `\author`). |
| `fact_derivation` | `ExtractedDocument`, normalized metadata | `SubmissionFacts` | Derive page count, section presence, title/abstract coverage, references estimate, anonymization cues, table/figure counts, and text-coverage signals. |
| `content_evaluation` | `ExtractedDocument`, `SubmissionFacts`, steering prompt | `ContentFindings` | Uses the chair's `prompt_fragments` to produce advisory-only findings tagged `source: "llm_content_evaluation"`. Can produce `warn` signals only — never `block`. Skipped when prompt is empty or gating is disabled. |
| `policy_evaluation` | `SubmissionFacts`, `PolicySnapshot` | `RuleFindings` | Apply deterministic rules only. No LLM or network-dependent judgment is allowed here. |
| `verdict_mapping` | `RuleFindings`, `ContentFindings` | canonical `verdict`, legacy `decision`, `score` | Map blocking rule failures to `block`, advisory failures (including LLM content findings) to `warn`, and clean runs to `pass`; keep the legacy decision map for current frontend compatibility. |
| `guidance_rendering` | all findings, verdict | remediation guidance | Render deterministic, rule-keyed remediation text for authors and chairs. LLM content findings are included in guidance output, tagged by source. |
| `persistence_audit` | full workflow state | stored run/stage records, response payload | Persist the run in workflow-specific tables and return a stable API response. |

### Stateful Workflow Object

The workflow state that moves through the stages should be explicit and serializable. Minimum fields:

- `run_id`
- `mode`
- `source`
- `conference_id`
- `submission_id`
- `actor`
- `input_fingerprint`
- `policy_hash`
- `normalized_request`
- `file_facts`
- `extracted_document`
- `submission_facts`
- `content_findings`
- `rule_findings`
- `verdict_bundle`
- `guidance`
- `stage_timings`
- `determinism_metadata`
- `error`

## Interfaces / Tools / Dependencies

### Compatibility Boundary

- Frontend-facing advisory route stays unchanged: `POST /api/v1/conferences/{conference_id}/submissions/precheck` currently sends only the uploaded file and should continue to do so from the browser (`frontend/lib/api/papers.ts:424-476`).
- Go backend becomes the compatibility and enforcement adapter:
  - `POST /api/v1/conferences/{conference_id}/submissions/precheck` calls AI-002 in `advisory` mode.
  - create-with-status-`published` and publish-from-draft call AI-002 in `gate` mode before allowing status transition (`backend/internal/controller/submission/submission.go:152-174`, `backend/internal/controller/submission/submission.go:613-625`).
- New `ai-service` routes are required and must remain separate from `agent_router`:
  - `POST /api/v1/workflows/submission-material-gating/runs`
  - `GET /api/v1/workflows/submission-material-gating/runs/{run_id}`

### Gate Semantics

- `pass`: allow the publish/create transition and return compatibility decision `accept_for_review`.
- `warn`: allow the transition, persist the flagged run, and return compatibility decision `manual_review`.
- `block`: reject the transition with a structured blocking payload and compatibility decision `desk_reject`.

Draft save remains advisory and ungated. The workflow applies only to author precheck previews plus transitions that move a submission into the published/review-intake path (`docs/platform-recon.md:105-109`, `frontend/components/author/submit/paper-submission-form.tsx:225-297`, `frontend/components/author/submit/paper-submission-form.tsx:519-583`).

### AI-002 Request Contract

`ai-service` should accept `multipart/form-data` with:

- `request`: JSON payload
- `file`: uploaded paper bytes

Recommended `request` shape:

```json
{
  "mode": "advisory",
  "source": "author_precheck",
  "conference_id": 123,
  "submission_id": 456,
  "actor": {
    "user_id": 789,
    "email": "author@example.com",
    "role": "author"
  },
  "submission": {
    "title": "Paper title",
    "abstract": "Paper abstract",
    "track": "main-track",
    "status": "published",
    "information": {
      "keywords": ["retrieval", "pdf"],
      "co_authors": ["coauthor@example.com"],
      "declared_conflicts": [
        {
          "email": "reviewer@example.com",
          "reason": "advisor"
        }
      ],
      "paper_type": "research",
      "track_name": "main-track",
      "additional_notes": "",
      "metadata": {
        "language": "en",
        "page_count": 0
      }
    }
  },
  "policy": {
    "maximum_pages": 8,
    "submission_format": "PDF",
    "review_type": "double-blind",
    "desk_rejection_settings": {},
    "workflow_settings": {
      "strict_deadlines": false
    }
  },
  "file_metadata": {
    "filename": "paper.pdf",
    "mime_type": "application/pdf",
    "size": 1048576
  }
}
```

The current frontend cannot provide this request by itself because it only sends `file`; the Go adapter must enrich the workflow request using conference state, actor identity, and submission metadata from the existing backend models and binders (`frontend/lib/api/papers.ts:424-476`, `frontend/components/author/submit/paper-submission-form.tsx:178-205`, `backend/internal/utils/submission_binder.go:19-46`, `backend/internal/utils/submission_binder.go:111-155`, `backend/internal/dto/conference.go:52-73`, `backend/internal/dto/submission.go:18-39`).

### AI-002 Response Contract

Recommended response shape:

```json
{
  "run_id": "smg_01HQ...",
  "input_fingerprint": "sha256:...",
  "policy_hash": "sha256:...",
  "verdict": "warn",
  "decision": "manual_review",
  "score": 0.64,
  "summary": {
    "total_findings": 6,
    "blocking_count": 0,
    "warning_count": 2,
    "pass_count": 4
  },
  "findings": [
    {
      "rule_id": "page_limit.max_pages",
      "severity": "warning",
      "status": "warning",
      "message": "Document exceeds preferred page count by 1 page.",
      "evidence": {
        "observed_value": 9,
        "expected_value": 8
      },
      "remediation_key": "reduce_pages"
    }
  ],
  "guidance": {
    "author_summary": "Trim the manuscript to 8 pages or fewer before final upload.",
    "chair_summary": "Allow manual review if policy permits."
  },
  "stage_timings": {
    "intake_normalization_ms": 4,
    "binary_integrity_ms": 2
  },
  "determinism": {
    "llm_used_for_verdict": false,
    "policy_version": "hash-only"
  }
}
```

When the Go adapter must answer the current browser contract, it should map the workflow response back into the existing `PrecheckResult` and `PrecheckBlockedError` shapes until the frontend types are upgraded (`frontend/lib/types.ts:18-61`, `backend/internal/dto/submission.go:107-112`).

### Selected Libraries

| Capability | Recommendation | Rationale | Official References |
| ---------- | -------------- | --------- | ------------------- |
| PDF parsing and extraction | `pypdf` | Pure-Python PDF reader with text and metadata extraction, stable packaging, and recent maintenance; use as the primary parser for page count, encryption status, metadata, and baseline text extraction. | [Docs](https://pypdf.readthedocs.io/en/3.9.0/), [PyPI](https://pypi.org/project/pypdf/), [Releases](https://github.com/py-pdf/pypdf/releases) |
| Layout-aware PDF extraction | `pdfplumber` | MIT-licensed layer on top of `pdfminer.six` that exposes chars, lines, rectangles, tables, and higher-level layout signals. Best fit for machine-generated academic PDFs and layout-derived compliance facts. | [Repository](https://github.com/jsvine/pdfplumber), [Releases](https://github.com/jsvine/pdfplumber/releases) |
| DOCX parsing | `python-docx` | De facto standard for reading Word DOCX files in Python. Provides structured access to paragraphs, runs, tables, heading styles, and core document properties (author, title, subject). Page count is not natively available in DOCX format but can be estimated from extended properties or content volume. | [Docs](https://python-docx.readthedocs.io/), [Repository](https://github.com/python-openxml/python-docx), [PyPI](https://pypi.org/project/python-docx/) |
| LaTeX parsing | `TexSoup` | Fault-tolerant BeautifulSoup-like parser for LaTeX documents. Enables tree-based navigation and search for `\section{}`, `\title{}`, `\begin{abstract}`, `\author{}`, and other structural commands. Suitable for deterministic section presence and anonymization checks on `.tex` source files. | [Docs](https://texsoup.alvinwan.com/), [Repository](https://github.com/alvinwan/TexSoup), [PyPI](https://pypi.org/project/TexSoup/) |
| File type detection | `python-magic` | Wraps `libmagic` for reliable MIME type detection from file content bytes. Required because AI-002 accepts PDF, DOCX, and LaTeX and must distinguish formats beyond extension or header checks alone. | [Repository](https://github.com/ahupp/python-magic), [PyPI](https://pypi.org/project/python-magic/) |
| Policy evaluation | `rule-engine` | BSD-3-Clause expression library with optional typing, regex support, datetime handling, and deterministic evaluation over Python objects. Suitable for policy rules over normalized facts. | [Docs](https://zerosteiner.github.io/rule-engine/index.html), [Repository](https://github.com/zeroSteiner/rule-engine), [Releases](https://github.com/zeroSteiner/rule-engine/releases) |
| Guidance rendering | `Jinja2` | Mature deterministic templating engine with current security maintenance. Use to render remediation text from fixed templates keyed by rule results rather than generating guidance with an LLM. | [Docs](https://jinja.palletsprojects.com/en/stable/), [Releases](https://github.com/pallets/jinja/releases) |
| Similarity and integrity heuristics | `RapidFuzz` | MIT-licensed fuzzy matching toolkit with fast implementations and pure-Python fallback. Useful for deterministic comparisons such as title drift, repeated section headers, or coarse similarity checks without external services. | [Docs](https://rapidfuzz.github.io/RapidFuzz/), [Releases](https://github.com/rapidfuzz/RapidFuzz/releases) |
| Deferred scholarly parser | `GROBID` | Production-ready scholarly PDF parser with strong article-structure extraction, but it introduces a separate JVM-based service and higher operational cost. Keep as a future sidecar option, not a v1 dependency. | [Docs](https://grobid.readthedocs.io/en/latest/Introduction/), [Repository](https://github.com/kermitt2/grobid) |

### Explicit Non-Selections

- No verdict-affecting LLM calls in deterministic stages. The `content_evaluation` stage uses LLM output only for advisory `warn`-level findings; it cannot produce a `block` verdict. The `policy_evaluation` and `verdict_mapping` stages remain fully deterministic (`references/AI-002/05-chair-configuration-ui.md`).
- No OCR in v1. Image-only, encrypted, corrupt, or unreadable files should be treated as `block` rather than introducing nondeterministic OCR or external document services in the first gate.

## Delivered vs Partial vs Missing vs Deviations

### Delivered

- An authenticated advisory precheck surface already exists in both frontend and Go backend (`frontend/lib/api/papers.ts:424-476`, `frontend/components/author/submit/file-upload-step.tsx:46-83`, `backend/cmd/server/main.go:293-300`, `backend/internal/controller/submission/precheck.go:21-86`).
- Conference configuration already persists several policy inputs AI-002 needs, including page limit, submission format, review type, desk-rejection settings, and workflow strict-deadline flags (`backend/internal/dto/conference.go:18-73`, `frontend/lib/types.ts:118-170`).
- The Go backend already has hook points for create/publish gating and a reusable blocking error contract, even though enforcement is disabled right now (`backend/internal/controller/submission/precheck_gate.go:33-62`, `backend/internal/dto/submission.go:107-112`, `frontend/components/author/submit/paper-submission-form.tsx:149-157`).
- `ai-service` already has reusable shared-service patterns for auth, DB, Redis, and service startup that AI-002 can follow without sharing AI-001 runtime state (`ai-service/app/main.py:43-60`, `ai-service/app/core/config.py:17-46`).

### Partial

- Submission metadata is present in create/update payloads, but the current advisory precheck call does not send it. The Go adapter must enrich AI-002 requests from backend state (`frontend/components/author/submit/paper-submission-form.tsx:178-205`, `frontend/lib/api/papers.ts:424-476`, `backend/internal/utils/submission_binder.go:19-46`, `backend/internal/utils/submission_binder.go:111-155`).
- Chair policy surfaces exist, but some mappings are overloaded or UI-only. `minKeywords` is persisted into `min_references`, supplementary-material intent is translated into `custom_rules.min_datasets`, and strict-deadline UI is not wired even though the payload persists `workflow_settings.strict_deadlines` (`frontend/lib/conference-form.ts:351-410`, `frontend/components/wizard/creation/steps/topics-deadlines.tsx:367-389`).
- The current desk-rejection subsystem already has a staged pipeline and report schema, but it is advisory-only, stores nothing, and is not deterministic enough to serve as AI-002 unchanged (`backend/internal/deskrejection/README.md:7-33`, `backend/internal/deskrejection/models/models.go:81-127`, `backend/internal/deskrejection/pipeline/pipeline.go:17-21`, `backend/internal/deskrejection/pipeline/pipeline.go:86-99`).

### Missing

- The isolated AI-002 workflow router, request/response schemas, state model, and persistence schema in `ai-service` are missing (`ai-service/app/main.py:95-96`, `ai-service/app/api/routes.py:32-53`, `ai-service/app/db/models.py:29-116`).
- The canonical `pass | warn | block` workflow contract and compatibility mapping do not exist in shipped backend/frontend types today (`docs/ai-integration.md:62-64`, `frontend/lib/types.ts:18-47`).
- Formal enforcement in create/publish flows is missing because the gate is explicitly disabled for testing (`backend/internal/controller/submission/submission.go:168-174`, `backend/internal/controller/submission/submission.go:624-625`).
- The v1 Python dependency stack for multi-format extraction (PDF, DOCX, LaTeX), file type detection, rule execution, and templated guidance is not present in `ai-service` dependencies (`ai-service/pyproject.toml:9-22`).
- The backend Go file storage layer does not yet accept `.docx` or `.tex` uploads for paper submissions (`backend/internal/storage/file/file.go:39-49`).
- The conference creation wizard has no UI for submission gating rules or LLM steering prompt. `ConferenceFormData` has no corresponding fields, and `conference-form.ts` does not serialize into `desk_rejection_settings` (`frontend/components/wizard/creation/types.ts:34-74`, `frontend/components/wizard/creation/steps/policy-guidelines.tsx`, `frontend/lib/conference-form.ts`).

### Deviations

- The roadmap target is an isolated AI workflow, but the current precheck behavior lives in the Go backend desk-rejection subsystem rather than `ai-service`. The legacy Go pipeline is now marked for removal and will be replaced by the `ai-service` proxy pattern (`docs/ai-integration.md:69-73`, `backend/internal/controller/submission/precheck.go:71-86`, `ai-service/app/api/routes.py:32-53`).
- The current decision taxonomy is `accept_for_review | manual_review | desk_reject`, not `pass | warn | block` (`frontend/lib/types.ts:18-24`, `backend/internal/deskrejection/models/models.go:106-113`).
- The chair UI advertises `PDF`, `LaTeX`, and `Word` as accepted manuscript formats, and AI-002 v1 now supports all three. The Go backend file storage layer must be updated to accept `.docx` and `.tex` alongside `.pdf` (`frontend/components/wizard/creation/steps/policy-guidelines.tsx:15-27`, `frontend/components/wizard/creation/steps/policy-guidelines.tsx:182-207`, `backend/internal/storage/file/file.go:39-49`, `backend/internal/storage/file/file.go:237-241`).

## Risks / Follow-ups

### Blocking Decisions

- None architecturally, if the team accepts the design decisions already locked in this record: multi-format v1 (PDF, DOCX, LaTeX), no verdict-affecting LLM calls, unchanged frontend precheck route, Go proxy adapter, and isolated `ai-service` workflow routing.

### Non-Blocking Risks

- Policy persistence remains awkward in a few places, so AI-002 should treat the Go conference DTO as the source of truth and not the chair wizard UI model (`frontend/lib/conference-form.ts:351-410`, `docs/platform-recon.md:194-200`).
- The current browser precheck sends only `file`, so the Go adapter must enrich AI-002 requests with submission metadata and policy snapshot material (`frontend/lib/api/papers.ts:424-476`, `backend/internal/utils/submission_binder.go:19-46`, `backend/internal/dto/conference.go:52-73`).
- Deterministic embedded extraction will be less structurally rich than a GROBID sidecar until a later upgrade, especially for scholarly header parsing and citation structure.
- Image-only, encrypted, or malformed files will be blocked in v1 because OCR and external parsing sidecars are intentionally deferred.
- DOCX page count is not natively available in the DOCX format (pagination is rendering-dependent). AI-002 must estimate page count from extended properties (`app.xml`) or content volume rather than reporting an exact count.
- LaTeX compilability is not verified; `TexSoup` performs structural parsing only. Malformed `.tex` files that cannot be parsed will be treated as `block`.

### Implementation-Start Checklist

1. Add isolated workflow routers, schemas, and dependency injection paths in `ai-service` without modifying `agent_router`.
2. Add workflow-specific persistence tables separate from `ai_sessions`, `ai_messages`, and `ai_tool_audit`.
3. Add `pypdf`, `pdfplumber`, `python-docx`, `TexSoup`, `python-magic`, `rule-engine`, `Jinja2`, and `RapidFuzz` to `ai-service`.
4. Implement the nine deterministic stages with format-specific extraction paths (PDF, DOCX, LaTeX), LLM steering via `content_evaluation`, and persist run plus stage metadata.
5. Convert the Go precheck endpoint into a proxy adapter: strip the legacy desk-rejection pipeline and `PaperRuleConfig` conversion, enrich advisory requests with conference/submission state, forward to `ai-service`, and map the workflow output back to the current frontend contract.
6. Update the Go backend file storage layer to accept `.docx` and `.tex` uploads alongside `.pdf` for paper submissions (`backend/internal/storage/file/file.go:39-49`).
7. Add the "Submission Gating" `WizardFormCard` to the Policy & Guidelines wizard step, add corresponding fields to `ConferenceFormData`, and extend `conference-form.ts` to serialize into `desk_rejection_settings` including `prompt_fragments` (`frontend/components/wizard/creation/steps/policy-guidelines.tsx`, `frontend/components/wizard/creation/types.ts`, `frontend/lib/conference-form.ts`).
8. Re-enable create/publish gate hooks against the AI-002 workflow in `gate` mode.
9. Remove or archive the legacy Go desk-rejection subsystem (`backend/internal/deskrejection/`) once the `ai-service` workflow is verified.
10. Add ai-service unit tests for each stage (including `content_evaluation` with mock LLM), contract tests for the new route, and Go adapter tests for advisory plus blocking behavior.

## Evidence Map

| Source | What It Proves |
| ------ | -------------- |
| `docs/ai-integration.md:53-73` | Original AI-002 scope, target inputs/outputs, and dependency statement. |
| `docs/platform-recon.md:94-109` | Author submission lifecycle is draft-versus-publish, which constrains where gating should apply. |
| `docs/platform-recon.md:194-212` | Policy surfaces exist, but persistence and governance coverage are incomplete. |
| `docs/feature-mapping.md:244-252` | A manuscript precheck already exists in the author flow. |
| `frontend/lib/api/papers.ts:424-476` | The current browser precheck route sends only multipart `file`. |
| `frontend/components/author/submit/file-upload-step.tsx:46-83` | Precheck is triggered immediately on PDF upload in the author UI. |
| `frontend/components/author/submit/paper-submission-form.tsx:519-583` | Final submit already expects precheck-derived gating behavior. |
| `frontend/lib/conference-form.ts:351-410` | Chair policy persistence is partly overloaded and needs normalization before AI-002 consumes it. |
| `backend/internal/controller/submission/precheck.go:71-86` | The current precheck endpoint converts conference config and runs the desk-rejection pipeline without persistence. |
| `backend/internal/controller/submission/precheck_gate.go:33-62` | A blocking gate helper already exists and maps failures to `PRECHECK_BLOCKED`. |
| `backend/internal/controller/submission/submission.go:168-174` | Create-as-published currently disables formal precheck gating. |
| `backend/internal/controller/submission/submission.go:624-625` | Publish-from-draft currently disables formal precheck gating. |
| `backend/internal/storage/file/file.go:39-49` | Backend file storage currently enforces PDF-only with a 20 MB limit for paper uploads; must be extended for DOCX and LaTeX. |
| `backend/internal/deskrejection/pipeline/pipeline.go:86-99` | The current desk-rejection pipeline can append Gemini results and is not deterministic enough for AI-002 as-is. |
| `ai-service/app/main.py:95-96` | `ai-service` currently mounts only health/status and AI-001 agent routers. |
| `ai-service/app/db/models.py:29-116` | Existing AI-service tables are AI-001 session/message/tool audit tables, not workflow tables. |
| `backend/internal/dto/conference.go:5-29` | `DeskRejectionSettings` already has all required rule fields and `prompt_fragments` for LLM steering; the wizard just does not expose them. |
| `frontend/components/wizard/creation/types.ts:34-74` | `ConferenceFormData` has no fields for gating rules or steering prompt; must be extended. |
| `frontend/components/wizard/creation/steps/policy-guidelines.tsx:83-388` | The Step 3 wizard has no `WizardFormCard` for submission gating; the entire section is missing from the UI. |
