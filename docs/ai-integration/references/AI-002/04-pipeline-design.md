# AI-002 Pipeline Design

## Isolation Boundary

- AI-002 lives in `ai-service` as a separate workflow surface.
- It must not share routes, prompt state, or persistence tables with AI-001.
- Shared infrastructure reuse is allowed only for auth, DB engine/session creation, Redis, logging, and common HTTP clients (`ai-service/app/main.py:43-60`, `ai-service/app/api/routes.py:32-53`, `ai-service/app/db/models.py:29-116`).

## End-To-End Handshake

1. The browser keeps calling `POST /api/v1/conferences/{conference_id}/submissions/precheck` with the uploaded file (`frontend/lib/api/papers.ts:424-476`).
2. The Go backend loads actor, conference configuration, and submission metadata and builds the normalized AI-002 `request` payload.
3. The Go backend sends `multipart/form-data` to `POST /api/v1/workflows/submission-material-gating/runs` in `ai-service`.
4. `ai-service` executes the deterministic eight-stage workflow, persists the run, and returns the canonical response.
5. The Go backend maps the response back to the current frontend contract for advisory precheck and uses the same workflow in `gate` mode during create/publish transitions.

## Stage Map

| Stage | Input | Output |
| ----- | ----- | ------ |
| `intake_normalization` | multipart `request`, file | `NormalizedRequest`, `PolicySnapshot`, `InputFingerprint` |
| `binary_integrity` | normalized request, file bytes | `FileFacts`, integrity findings |
| `document_extraction` | validated file (PDF, DOCX, or LaTeX) | `ExtractedDocument` |
| `fact_derivation` | extracted document, normalized metadata | `SubmissionFacts` |
| `content_evaluation` | extracted document, submission facts, steering prompt | `ContentFindings` (advisory `warn`-level only) |
| `policy_evaluation` | submission facts, policy snapshot | `RuleFindings` |
| `verdict_mapping` | rule findings, content findings | canonical `verdict`, legacy `decision`, `score` |
| `guidance_rendering` | findings, verdict | remediation guidance |
| `persistence_audit` | full workflow state | stored run/stage records, response payload |

No LLM may affect `policy_evaluation` or `verdict_mapping`. The `content_evaluation` stage uses the chair's steering prompt to produce advisory-only findings tagged `source: "llm_content_evaluation"`. These findings can contribute `warn`-level signals but cannot produce `block` verdicts. The stage is skipped when `prompt_fragments` is empty or gating is disabled.

## Stateful Object

Recommended workflow state envelope:

```text
SubmissionMaterialGatingState
- run_id
- mode
- source
- conference_id
- submission_id
- actor
- input_fingerprint
- policy_hash
- normalized_request
- file_facts
- extracted_document
- submission_facts
- content_findings       # output of content_evaluation stage; empty when stage is skipped
- rule_findings
- verdict_bundle
- guidance
- stage_timings
- determinism_metadata
- error
```

## Route Contracts

### Proposed AI-Service Routes

- `POST /api/v1/workflows/submission-material-gating/runs`
- `GET /api/v1/workflows/submission-material-gating/runs/{run_id}`

### Request

- Transport: `multipart/form-data`
- Parts:
  - `request`
  - `file`

Required request fields:

- `mode`: `advisory | gate`
- `source`: `author_precheck | submission_create | submission_publish`
- `conference_id`
- `submission_id` when available
- `actor`
- `submission`
- `policy` (includes `desk_rejection_settings.prompt_fragments` for LLM steering)
- `file_metadata`

### Response

Required response fields:

- `run_id`
- `input_fingerprint`
- `policy_hash`
- `verdict`
- `decision`
- `score`
- `summary`
- `findings`
- `guidance`
- `stage_timings`
- `determinism`

## Persistence Separation

AI-002 should not reuse `ai_sessions`, `ai_messages`, or `ai_tool_audit`. Recommended workflow-specific persistence:

- `workflow_runs`
- `workflow_stage_runs`
- `submission_material_gating_runs`
- `submission_material_gating_findings`

The exact migration names can be chosen during implementation, but the data should remain separate from AI-001 runtime state.
