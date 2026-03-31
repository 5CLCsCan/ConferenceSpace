# AI-006 Chair Decision Copilot Implementation Spec

## Summary

Implement AI-006 as a submission-scoped, persisted, advisory-only workflow in the existing chair submission `reviews` tab. The frontend renders a typed copilot panel above the accept/reject controls. The Go backend owns authorization, evidence aggregation, fingerprinting, persistence, and route semantics. `ai-service` owns typed artifact generation and returns run metadata. The workflow never recommends a decision and never mutates submission status.

## Final Module Responsibilities

- Frontend `reviews` tab
  - render `idle | generating | ready | stale | failed`
  - call lookup, generate, and regenerate endpoints
  - show the current artifact and visible guardrails
  - remain visually separate from the decision form
- Frontend API client and hook
  - expose typed request/response helpers for AI-006
  - keep copilot lifecycle separate from existing review-save logic
- Go backend submission controller
  - verify chair authorization
  - aggregate submission, reviews, analytics, discussion, rebuttal, and decision-relevant history
  - compute evidence fingerprint
  - read and update current artifact state
  - append run records
  - call the internal AI workflow
- `ai-service` chair decision copilot workflow
  - validate normalized request payload
  - generate typed advisory artifact
  - enforce output guardrails
  - return artifact plus run metadata

## Data Model and Schema Changes

- Add current artifact persistence for AI-006:
  - `conference_id`
  - `submission_id`
  - `current_run_id`
  - `evidence_fingerprint`
  - `artifact_state`
  - `artifact_payload`
  - `generated_at`
  - `last_error`
- Add append-only run persistence for AI-006:
  - `conference_id`
  - `submission_id`
  - `triggered_by_user_id`
  - `trigger_type`
  - `evidence_fingerprint`
  - `status`
  - `started_at`
  - `completed_at`
  - `model_name`
  - `error_summary`
- Keep run records for the lifetime of the submission.
- Do not expose run history in the chair UI.

## API and Event Contracts

### Browser-Facing

- `GET /api/v1/conferences/{conference_id}/submissions/{submission_id}/decision-copilot`
  - returns current state and current artifact when present
  - never generates implicitly
- `POST /api/v1/conferences/{conference_id}/submissions/{submission_id}/decision-copilot/generate`
  - explicit initial generation
  - may reuse current artifact if fingerprint matches
- `POST /api/v1/conferences/{conference_id}/submissions/{submission_id}/decision-copilot/regenerate`
  - explicit forced rerun
  - always creates a new run

### Internal

- `POST /api/v1/workflows/chair-decision-copilot/resolve`
  - action: `lookup | generate | regenerate`
  - input: normalized evidence bundle, fingerprint, actor metadata, prompt/schema version
  - output: typed artifact, run metadata, status, and optional error

## Execution Flow

1. Chair opens the `reviews` tab.
2. Frontend calls `GET /decision-copilot`.
3. Backend reads the current artifact record and compares it against the current decision-relevant fingerprint.
4. Backend returns:
   - `idle` if no artifact exists
   - `ready` if the artifact is current
   - `stale` if an artifact exists but fingerprint no longer matches
   - `failed` if the latest state is failed and no current artifact exists
5. Chair clicks `Generate recommendation` or `Regenerate`.
6. Backend re-aggregates evidence, computes fingerprint, writes a `started` run, and either:
   - returns existing artifact for `generate` when fingerprint matches, or
   - calls `ai-service` for a new run
7. On success, backend stores the new artifact and updates the current artifact record.
8. On failure, backend records failed run metadata and preserves the last successful current artifact.

## Migration Notes

- Keep the existing accept/reject persistence flow unchanged.
- Add AI-006 without restructuring the chair submission detail route.
- Prefer mirroring the AI-003 workflow split instead of inventing a second orchestration style.
- Update roadmap wording later to remove directional “recommendation” phrasing.

## Testing Strategy

- Frontend:
  - state rendering tests
  - generate/regenerate interaction tests
  - stale behavior tests
  - visible guardrail assertions
- Backend:
  - route authorization tests
  - lookup/generate/regenerate semantics
  - fingerprint reuse and invalidation tests
  - rebuttal-disabled handling tests
  - no decision mutation regression tests
- AI-service:
  - schema validation tests
  - output guardrail tests
  - sparse evidence tests
  - rebuttal conditionality tests

## Risks

- Authority drift if the UI visually over-emphasizes the copilot near decision controls.
- Fingerprint drift if invalidation logic includes irrelevant history events.
- Rebuttal-related logic may be fragile while rebuttal configuration is still evolving.
- Discussion synthesis can become noisy if the workflow ingests too much raw thread text without normalization.

## Explicit Deferrals

- No run-history UI.
- No personalized chair prompts.
- No accept/reject recommendation or scoring.
- No asynchronous queued workflow in v1 unless latency proves unacceptable.
