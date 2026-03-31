# AI-010 Review Quality and Consistency Auditor Implementation Spec

## Summary

AI-010 adds an AI-driven semantic review auditing workflow to the reviewer submission path. The reviewer can request advisory audit results while drafting and receive structured pre-submit feedback before final submission. The Go backend remains the enforcement boundary, while `ai-service` owns the typed semantic audit workflow. AI-003 is optional additional input for coverage checks only.

The v1 implementation persists warning dismissals in backend-owned assignment audit metadata, logs reviewer-confirmed submit overrides when audit enforcement fails, and keeps the reviewer-authored review payload separate from system audit state.

## Final Module Responsibilities

- Reviewer frontend workflow
  - catch immediate form integrity issues locally before calling AI-010
  - send the current unsaved review payload to the review-audit endpoint for `draft_save` and `submit_preflight`
  - render active findings and dismissed warnings separately
  - allow dismissal and undismissal of warning findings
  - show a submit-confirmation override dialog when submit enforcement fails

- Go backend review-audit boundary
  - authenticate the assigned reviewer
  - revalidate request schema and submit invariants before calling `ai-service`
  - accept the current review payload from the browser-facing request or submit request
  - load optional AI-003 artifact and optional policy context
  - call the `ai-service` AI-010 workflow
  - reconcile workflow findings with stored dismissal metadata
  - enforce `submit_enforcement` during final review submission
  - record audit-failed-but-user-confirmed submit overrides

- `ai-service` review-quality-auditor workflow
  - validate the typed request contract
  - run structured LLM-driven semantic analysis across consistency, justification, completeness, coverage, and optional policy dimensions
  - use AI-003 only for optional additional coverage checks
  - return typed findings with stable code, field, severity, message, suggestion, and condition fingerprint
  - persist workflow run history for debugging and operational tracing

- Backend audit metadata and audit-event persistence
  - store current dismissal state per assignment
  - store append-only audit events for dismissal changes and submit overrides after audit failure

## Data Model and Schema Changes

- Main backend database
  - add `review_audit_state JSONB NOT NULL DEFAULT '{}'` to `paper_assignments`
  - initial JSON shape:
    - `dismissed_warnings`: array of objects with `code`, `condition_fingerprint`, and `dismissed_at`
  - add append-only table `review_audit_events`
  - required columns:
    - `id`
    - `conference_id`
    - `assignment_id`
    - `actor_id`
    - `event_type`
    - `audit_mode` nullable
    - `workflow_run_id` nullable
    - `payload_json`
    - `created_at`
  - initial event types:
    - `warning_dismissed`
    - `warning_undismissed`
    - `submit_override_after_audit_failure`

- `ai-service` database
  - add append-only run table for AI-010 workflow execution history
  - required fields:
    - `id`
    - `conference_id`
    - `assignment_id`
    - `submission_id`
    - `actor_id`
    - `mode`
    - `status`
    - `request_json`
    - `response_json` nullable
    - `error_detail` nullable
    - `completed_at`
  - no current-artifact table is required in v1 because AI-010 is an evaluation workflow, not a persisted artifact workflow

## API and Event Contracts

- Browser-facing audit endpoint
  - `POST /api/v1/conferences/{conference_id}/assignments/{assignment_id}/review-audit`
  - request body:
    - `mode`: `draft_save` or `submit_preflight`
    - `review_score`
    - `review_data`
  - response body:
    - `status`: `pass` | `warn` | `block`
    - `active_findings`: list of findings after dismissal reconciliation
    - `dismissed_findings`: list of warnings currently suppressed by stored dismissal metadata
    - `run_id` optional
    - `error` optional when workflow fails

- Warning dismissal endpoint
  - `PUT /api/v1/conferences/{conference_id}/assignments/{assignment_id}/review-audit/dismissals`
  - request body:
    - `code`
    - `condition_fingerprint`
    - `dismissed`: boolean
  - behavior:
    - `true` adds or refreshes dismissal metadata
    - `false` removes dismissal metadata for that code and condition fingerprint
    - each write creates a `review_audit_events` record

- Existing review save endpoint
  - keep `PUT /api/v1/conferences/{conference_id}/assignments/{assignment_id}/review`
  - when `status=draft`:
    - persist draft as today
    - no hard dependency on audit success
  - when `status=submitted`:
    - reject malformed or incomplete submit payloads before AI-010 is called
    - derive `submit_enforcement`
    - run AI-010 using the current request payload before persistence
    - if audit returns blocking findings, reject the submit
    - if audit succeeds with no blocking findings, proceed with submission
    - if audit fails, require an explicit override flag in a follow-up submit confirmation request

- Submit override contract
  - extend submitted-review flow with explicit reviewer confirmation field, for example `override_audit_failure=true`
  - backend accepts the override only when the immediately preceding enforcement failure is attributable to workflow failure, not to returned blocking findings
  - accepted overrides create a `submit_override_after_audit_failure` event record

- Internal `ai-service` workflow
  - `POST /api/v1/workflows/review-quality-auditor/resolve`
  - request body:
    - `mode`: `draft_save` | `submit_preflight` | `submit_enforcement`
    - `conference_id`
    - `assignment_id`
    - `submission_id`
    - `actor`
    - `review`
    - `review_score`
    - `policy_context` optional
    - `ai003_context` optional
  - response body:
    - `status`: `pass` | `warn` | `block`
    - `run_id`
    - `findings`
    - `error` optional

- Workflow finding shape
  - `code`
  - `severity`: `warning` | `blocking`
  - `field`
  - `message`
  - `suggestion`
  - `condition_fingerprint`

## Execution Flow

1. Reviewer edits review fields in the submission review workspace.
2. Frontend catches obvious missing or malformed local state before invoking AI-010.
3. On draft save or explicit pre-submit check, frontend sends the current unsaved review payload to `review-audit`.
4. Go backend authenticates reviewer ownership, revalidates request shape, and loads optional AI-003 plus policy context.
5. Go backend calls the `ai-service` workflow with the current review payload and audit mode.
6. `ai-service` executes structured semantic audit and returns typed findings.
7. Go backend reconciles returned warning findings against stored dismissal metadata:
   - unchanged dismissed warnings move to `dismissed_findings`
   - new or changed warnings remain in `active_findings`
   - blocking findings always remain active
8. Frontend renders active findings and optionally collapsed dismissed warnings.
9. Reviewer may dismiss or undismiss warnings through the dismissal endpoint.
10. On final submit, backend first revalidates the submit request and only then reruns AI-010 in `submit_enforcement` using the current submit payload.
11. If blocking findings exist, backend rejects submission.
12. If workflow execution fails, backend returns an audit-failure response that requires explicit reviewer confirmation before a follow-up override submit.
13. If reviewer confirms override, backend logs the event and completes the submission.

## Migration Notes

- Add the new backend schema changes first:
  - `paper_assignments.review_audit_state`
  - `review_audit_events`
- Add the new `ai-service` run history table and workflow router second.
- Release browser-facing audit endpoint and dismissal endpoint before enabling submit enforcement in production.
- Roll out submit enforcement only after draft-save and preflight flows are stable.
- Existing review drafts require no data migration beyond default empty audit state.

## Testing Strategy

- Frontend
  - active vs dismissed warning rendering
  - dismissal and undismissal behavior
  - override confirmation UX after submit enforcement failure
  - correct handling of multiple findings targeting the same field

- Go backend
  - reviewer ownership checks for audit and dismissal routes
  - audit endpoint request validation
  - dismissal reconciliation behavior
  - enforcement on submitted reviews
  - override allowed only after audit failure, not after blocking findings
  - event logging for dismissals and overrides

- `ai-service`
  - request contract validation
  - semantic finding quality across all five audit dimensions
  - optional AI-003 behavior
  - prohibition on recommendation or score steering
  - stable `code` and `condition_fingerprint` generation
  - run-history persistence for success and failure

- End-to-end
  - draft save with warnings
  - draft save with dismissed warnings persisting after reload
  - submit blocked by blocking findings
  - submit allowed after clean enforcement
  - audit failure plus reviewer-confirmed override
  - AI-003 present vs absent coverage behavior

## Risks

- Condition fingerprints that are too coarse will keep warnings dismissed when they should reopen.
- Condition fingerprints that are too fine will reopen warnings too often and make dismissals feel unreliable.
- Policy checks can drift into over-enforcement if policy modeling remains vague.
- If AI-010 is reduced to heuristics instead of real semantic analysis, the feature will fail its core purpose even if the plumbing works.
- Optional AI-003 coverage checks can become noisy if AI-003 extraction quality is weak.
- Override confirmation after audit failure can be abused if not logged clearly and bounded to actual workflow failure cases.

## Explicit Deferrals

- Evidence-reference support in AI-010 findings.
- Chair-facing UI for every override event.
- Discussion-, rebuttal-, or cross-review-driven audit rules.
- Persisted current-artifact view of audit results in the main backend.
- Broader cross-feature evidence handling and traceability design.
