# AI-010 Review Quality and Consistency Auditor Design

## Goals

- Improve reviewer draft quality before final submission by detecting contradictions, missing justification, and missing coverage.
- Keep review-quality enforcement inside the existing reviewer review workflow rather than adding a separate workspace.
- Provide structured, field-level findings that a reviewer can act on quickly.
- Use actual AI-driven semantic analysis for review-quality judgments instead of reducing the feature to heuristics.
- Use AI-003 as optional neutral coverage context without turning AI-010 into a recommendation or scoring assistant.
- Ensure final submit enforcement is server-owned rather than dependent on frontend-only checks.

## Non-Goals

- Rewriting reviewer prose or normalizing reviewer voice.
- Suggesting what recommendation or scores the reviewer should choose.
- Using discussion, rebuttal, other reviewers' reviews, or chair-only context in v1.
- Replacing the existing review save or submit flow with a separate submission mechanism.
- Owning basic form-schema validation such as missing required fields or invalid score ranges.
- Blocking basic AI-010 rollout on a fully developed rubric or review-policy engine.

## Actors and Workflows

- Primary actor: assigned reviewer editing a review draft for one assignment.
- Secondary beneficiary: chair, who later receives a more coherent submitted review.
- Trigger points:
  - draft save: advisory audit feedback only
  - submit attempt: pre-submit audit with blocking or warning findings depending on severity and policy
- Context boundary:
  - assignment-local review payload
  - reviewer-visible AI-003 artifact for the same assignment
  - optional conference review-policy controls when available

## Core Entities

- Review draft payload:
  - criteria scores
  - overall recommendation
  - confidence
  - feedback sections
- Audit result:
  - overall status such as `pass`, `warn`, or `block`
  - typed findings linked to concrete review fields
  - remediation guidance for the reviewer
- Audit finding identity:
  - stable `code`
  - `condition_fingerprint` representing the exact condition instance that triggered the finding
- Audit finding payload:
  - `code`
  - `severity`: `warning` or `blocking`
  - `field`
  - `message`
  - `suggestion`
  - `condition_fingerprint`
- Audit dimensions:
  - `consistency`
  - `justification`
  - `coverage`
  - `completeness`
  - `policy` when conference configuration exposes stricter review requirements
- Audit field taxonomy:
  - `review`
  - `recommendation`
  - `confidence`
  - `summary`
  - `strengths`
  - `weaknesses`
  - `questions`
  - `criteria.originality`
  - `criteria.technical_quality`
  - `criteria.clarity`
  - `criteria.significance`
  - `criteria.methodology`
- Multiple findings may target the same field when distinct issues apply.
- Neutral coverage context:
  - the persisted AI-003 artifact for the same assignment when available
- Optional policy context:
  - conference review-policy or rubric strictness settings when the platform exposes them cleanly

## Module Boundaries

- Frontend:
  - stays in the existing reviewer submission review screen
  - catches immediate form integrity issues before AI-010 is called
  - triggers AI-010 audit on draft save and submit attempt
  - renders advisory and blocking findings
  - does not own final audit authority
- Go backend:
  - remains the public browser-facing API boundary
  - verifies reviewer ownership for the assignment
  - revalidates request schema and submit invariants before invoking AI-010
  - accepts the current review payload from the browser-facing audit or submit request
  - loads optional AI-003 artifact and any policy context needed for the audit request
  - owns submit-time enforcement before review persistence
  - proxies typed audit requests into `ai-service`
- `ai-service`:
  - owns the AI-010 workflow contract and typed audit result schema
  - runs structured LLM-driven semantic audit across consistency, justification, coverage, completeness, and optional policy dimensions
  - uses AI-003 only as optional additional material for narrow coverage checks
  - returns structured findings suitable for direct UI rendering and backend enforcement

## Data and Storage

- The existing review draft remains the source of truth for the reviewer-authored content.
- AI-003 is a read-only optional upstream input for AI-010.
- AI-010 v1 is designed as an evaluation workflow first, not necessarily as a persisted artifact workflow.
- Dismissed warning state is persisted as backend-owned assignment-scoped audit metadata.
- Dismissed warning state should minimally store:
  - finding `code`
  - finding `condition_fingerprint`
  - dismissal timestamp
- That metadata must stay separate from `review_data`, which remains reviewer-authored content only.
- `ai-service` may keep workflow run history if needed, but it is not the source of truth for reviewer dismissal acknowledgments.
- Persistence for broader audit runs or histories is intentionally not locked yet and must be decided later with the API and lifecycle sections.

## API Contracts

- Browser-facing contract:
  - add a dedicated assignment-scoped audit endpoint for explicit reviewer-triggered audit requests
  - keep the existing assignment-scoped review save route for draft persistence and final submission
  - require the backend to re-run AI-010 during final submit before persisting `submitted`
- Recommended public route direction:
  - `POST /api/v1/conferences/{conference_id}/assignments/{assignment_id}/review-audit`
  - keep `PUT /api/v1/conferences/{conference_id}/assignments/{assignment_id}/review`
- Browser-facing audit behavior:
  - draft save may call `review-audit` explicitly with the current unsaved review payload to fetch advisory findings after local form integrity checks pass
  - submit attempt may call `review-audit` with the current unsaved review payload for preflight UX, but the backend must still enforce the audit again inside final submit after backend request validation passes
  - after merging workflow findings with stored dismissal metadata, the browser-facing response should distinguish active findings from dismissed warnings
- Internal `ai-service` contract direction:
  - typed resolve-style request carrying `mode`, the current review payload, optional AI-003 context, and optional policy context
  - typed response carrying overall audit status and field-level findings
  - audit status is limited to `pass`, `warn`, or `block`
  - finding severity is limited to `warning` or `blocking`
- Audit invocation modes:
  - `draft_save`
  - `submit_preflight`
  - `submit_enforcement`
- Mode semantics:
  - `draft_save` returns advisory findings but must not prevent draft persistence
  - `submit_preflight` returns the full audit result for reviewer UX before final submit
  - `submit_enforcement` is the authoritative backend rerun used to allow or reject final submission
- Ownership rules:
  - only the assigned reviewer for the assignment may request the audit or submit the review
  - the Go backend remains the only public caller into `ai-service`
- V1 contract simplification:
  - findings should stay field-level and remediation-oriented
  - do not add `evidence_refs` or evidence-linking structures yet
  - reserve evidence-backed traceability for a later cross-feature evidence-handling pass
  - dismissal state should be added at the Go API boundary, not in the raw `ai-service` finding schema

## Lifecycle and Failure Modes

- Draft-save audit is advisory and should not prevent draft persistence.
- Basic required-field and schema validation should be caught in UI first and revalidated in backend before AI-010 is invoked.
- Submit-time audit must run on the server before a review is accepted as submitted.
- Warning-level findings are dismissible in v1.
- Blocking findings are not dismissible.
- Dismissed warnings must persist with the assignment draft across reloads.
- Dismissed warnings must reopen automatically when the audit rerun determines that the finding has materially changed or reappeared.
- Reopen behavior is keyed by finding `code` plus `condition_fingerprint`, not by raw message text.
- If `submit_enforcement` fails because the workflow is unavailable, times out, or returns an invalid contract, the reviewer must be clearly notified that AI-010 did not complete.
- In that failure case, the system must require an explicit reviewer confirmation before allowing final submission to continue without a successful audit result.
- The system must not silently claim a passed audit if the audit workflow failed or was unavailable.
- The dismissal metadata must be keyed in a way that supports automatic reopen behavior when the underlying condition changes.
- AI-003-dependent coverage checks must degrade gracefully when the AI-003 artifact is absent.
- Audit-failed-but-user-confirmed submissions must be recorded in backend metadata or audit logs for later chair and operational visibility.
- The exact storage shape and visibility surface for that override record are not locked yet.
- Default semantic findings should remain advisory unless explicit policy or platform rules justify blocking enforcement.

## AI-003 Usage Boundary

- AI-003 is optional additional material only.
- AI-003 may influence only `coverage` findings.
- Allowed AI-003-assisted coverage checks:
  - whether the review engages with main claimed contributions
  - whether the review addresses stated scope or limitations
  - whether the review touches reviewer attention points surfaced in AI-003
- If AI-003 is absent:
  - AI-010 still runs
  - AI-003-specific coverage rules are skipped
  - non-AI-003 consistency, justification, completeness, and policy checks remain active
- AI-003 must not be used to:
  - infer the correct recommendation
  - infer the correct score
  - infer the correct confidence level
  - tell the reviewer what conclusion to reach
  - generate verdict-like guidance

## Migration and Rollout

- AI-010 should layer onto the current review page and backend review save flow incrementally.
- The first rollout can coexist with the current minimal frontend and backend validation until submit-time enforcement is fully integrated.
- No reviewer migration is needed because AI-010 augments an existing assignment review flow.

## Testing and Observability

- Expected focus areas are:
  - semantic finding quality and schema correctness
  - AI-003 coverage-boundary correctness
  - correct separation between UI/backend validation and AI-010 semantic audit
  - submit-time enforcement behavior
  - draft-save advisory behavior
  - explicit failure handling when audit execution is unavailable
- The exact logging and telemetry contract is not locked yet.
