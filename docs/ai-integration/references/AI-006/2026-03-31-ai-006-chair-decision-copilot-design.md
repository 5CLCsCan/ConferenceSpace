# AI-006 Chair Decision Copilot Design

## Goals

- Reduce chair synthesis effort on submission decision pages.
- Produce a single advisory evidence package from already-available decision context.
- Preserve explicit chair ownership of every final decision action.
- Make authority boundaries visible in both copy and behavior.
- Reuse the existing chair submission workflow instead of creating a separate AI decision workspace.

## Non-Goals

- Do not recommend accept or reject.
- Do not score, rank, or predict acceptance likelihood.
- Do not auto-submit any decision.
- Do not mutate submission status outside explicit chair actions.
- Do not replace the raw reviews, discussion, or history tabs.
- Do not accept chair-authored steering prompts or personal opinion as generation input.

## Actors and Workflows

- Primary actor: chair.
- Entry point: the existing chair submission `reviews` tab.
- Trigger: the chair clicks `Generate recommendation`.

Workflow:

1. The panel starts in `idle` with an explicit generate action.
2. The chair triggers generation manually.
3. The backend aggregates decision-relevant evidence, computes the evidence fingerprint, and looks up the current shared artifact.
4. If a fresh artifact already exists, the backend returns it.
5. If no fresh artifact exists, the backend runs the AI workflow and persists the new artifact plus a lightweight run record.
6. The chair reviews the advisory package alongside the raw evidence and still explicitly submits `accept` or `reject` using the existing decision control.

Locked workflow rules:

- Generation is explicit, never automatic.
- The output is evidence-only and non-directional.
- Manual `Regenerate` is available even when the fingerprint is unchanged.
- Stale artifacts do not regenerate on page load.
- Reviewer narrative feedback is a first-class input alongside numeric analytics.

## Core Entities

- `source evidence bundle`
  - normalized, chair-visible decision evidence collected by the Go backend
- `decision copilot artifact`
  - typed advisory package rendered in the UI and shared across chairs for the submission
- `generation state`
  - `idle | generating | ready | stale | failed`
- `evidence fingerprint`
  - normalized hash of decision-relevant evidence plus prompt/schema version
- `decision copilot run`
  - lightweight internal audit/debugging record for each generate or regenerate attempt
- `current artifact record`
  - current submission-scoped pointer to the latest successful artifact

## Module Boundaries

- Frontend
  - the existing chair submission detail view remains the user entry point
  - the copilot panel lives in the existing `reviews` tab above, but not inside, the decision controls
  - the frontend only performs lookup, generate, and regenerate calls and renders typed states
- Go backend
  - verifies chair access
  - aggregates decision-relevant evidence
  - computes the evidence fingerprint
  - persists current artifact and run records
  - calls `ai-service`
- `ai-service`
  - validates the normalized request
  - generates the typed artifact
  - returns run metadata and the advisory payload

This keeps permission checks, fingerprinting, persistence, and workflow execution off the client.

## Data and Storage

### Contract Constraints

- Consume only chair-visible, decision-relevant evidence.
- Never persist or expose a directional verdict field.
- Never bind generated output to automatic status transitions.
- Persist generated output until the evidence bundle changes.
- Scope persisted output to the submission so all authorized chairs reuse the same package.
- Rebuttal-derived analytics are conditional and appear only when rebuttal is enabled and evidence exists.
- Show only the latest artifact in the chair UI while keeping lightweight internal run history.
- Invalidate the artifact only on decision-relevant evidence changes.
- Persist a typed sectioned artifact instead of a freeform generated blob.

### Persistence Shape

- `decision_copilot_artifact`
  - one current row per submission
  - fields:
    - `conference_id`
    - `submission_id`
    - `current_run_id`
    - `evidence_fingerprint`
    - `artifact_state`
    - `artifact_payload`
    - `generated_at`
    - `last_error` nullable
- `decision_copilot_run`
  - append-only lightweight run history
  - fields:
    - `id`
    - `conference_id`
    - `submission_id`
    - `triggered_by_user_id`
    - `trigger_type` as `generate | regenerate`
    - `evidence_fingerprint`
    - `status` as `started | succeeded | failed`
    - `started_at`
    - `completed_at`
    - `model_name`
    - `error_summary` nullable

### Retention

- Keep all run records for the lifetime of the submission.
- Do not expose run history in the chair UI.
- Treat run history as internal-only for audit and debugging.

### Current-State Behavior

- The chair UI reads only the current artifact record.
- Each generate or regenerate attempt creates a run record.
- A successful run updates the current artifact record.
- A failed rerun records failure without deleting the previous readable current artifact.

### Artifact Sections

- `evidence_summary`
- `review_feedback_synthesis`
- `review_analytics`
- `discussion_signals`
- `rebuttal_signals`
- `disagreement_map`
- `suggested_chair_note`
- `guardrails`
- `evidence_fingerprint`
- `generated_at`

## API Contracts

### Browser-Facing Routes

- `GET /api/v1/conferences/{conference_id}/submissions/{submission_id}/decision-copilot`
  - returns current state plus latest shared artifact when present
  - does not generate implicitly
- `POST /api/v1/conferences/{conference_id}/submissions/{submission_id}/decision-copilot/generate`
  - explicit initial generation
  - may return an existing fresh artifact instead of rerunning when the fingerprint is unchanged
- `POST /api/v1/conferences/{conference_id}/submissions/{submission_id}/decision-copilot/regenerate`
  - explicit manual rerun
  - always creates a new run and updates the current artifact pointer on success

### Internal Workflow Contract

- `POST /api/v1/workflows/chair-decision-copilot/resolve`
  - action: `lookup | generate | regenerate`
  - receives normalized evidence bundle, evidence fingerprint, actor metadata, and prompt/schema version
  - returns typed artifact plus run metadata

### Backend Responsibility Split

- Frontend triggers lookup, generate, and regenerate only.
- Go backend verifies chair access and aggregates decision-relevant evidence.
- Go backend computes the evidence fingerprint and persists current artifact plus lightweight runs.
- Go backend calls `ai-service` with a normalized evidence bundle.
- `ai-service` returns the typed artifact plus run metadata.

## Evidence Bundle and Fingerprint

### Accepted Evidence Inputs

- Submission context
  - `conference_id`
  - `submission_id`
  - title
  - abstract
  - track
  - keywords
  - visible submission status
  - chair-visible authors and declared conflicts where already present in the decision surface
- Reviews
  - review status
  - recommendation
  - confidence
  - review score
  - criteria scores
  - narrative feedback from `summary`, `strengths`, `weaknesses`, and optional `questions`
  - review timestamps relevant to decision context
- Derived review analytics
  - recommendation distribution
  - confidence mix
  - weakest and strongest criteria
  - review coverage completeness
- Discussion signals
  - thread count
  - message count
  - last discussion activity timestamp
  - normalized discussion content only if needed for synthesis
- Rebuttal signals, conditional
  - whether rebuttal is enabled for the conference
  - rebuttal points and statuses
  - reviewer acknowledgments
  - score changes after rebuttal
  - explicit `not_applicable` when rebuttal does not apply
- Decision-relevant history markers
  - latest review event timestamp
  - latest rebuttal event timestamp when applicable
  - latest discussion event timestamp
  - latest submission metadata or status event that changes decision context

### Accepted Fingerprint Inputs

- normalized submission metadata visible to the chair and relevant to decision context
- normalized review payloads and statuses
- rebuttal state only when rebuttal applies
- normalized discussion signals relevant to synthesis
- latest decision-relevant history markers
- prompt/schema version string

Fingerprint rule:

- hash normalized source evidence inputs, not derived generated analytics output

Invalidation triggers:

- review created, updated, or submitted
- rebuttal point or reviewer acknowledgment changed when rebuttal applies
- discussion thread or message added
- submission metadata visible to the chair changed
- status or history changes that alter decision context

## Lifecycle and Failure Modes

### States

- `idle`
- `generating`
- `ready`
- `stale`
- `failed`

### Lifecycle Behavior

- `idle`
  - no artifact exists yet for the submission
  - UI shows the empty state and explicit `Generate recommendation`
- `generating`
  - a generate or regenerate run is in progress
  - if no prior artifact exists, show loading only
  - if a prior artifact exists, keep rendering it and show non-blocking refresh state
- `ready`
  - current artifact exists and matches the current evidence fingerprint
  - UI shows the shared artifact and `Regenerate`
- `stale`
  - current artifact exists but no longer matches the current evidence fingerprint
  - UI keeps showing the old artifact with a stale banner and `Regenerate`
  - do not silently regenerate on page load
- `failed`
  - the latest run failed
  - if no prior artifact exists, show failure state with retry
  - if a prior artifact exists, keep showing the last readable artifact and surface that refresh failed

### Failure Rules

- generation failure must be explicit
- sparse or incomplete evidence must be surfaced explicitly
- no fallback should invent a conclusion when evidence is weak
- failed generate must never delete the last successful current artifact
- failed regenerate creates a failed run record only
- if required evidence loading fails due to backend or permission error, return `failed`
- if rebuttal is disabled, rebuttal-related fields resolve to `not_applicable`, not `failed`
- guardrails render in every non-idle state, including `stale` and `failed` with a prior artifact

## Migration and Rollout

- Add AI-006 to the existing chair submission detail workflow first.
- Keep the existing accept/reject persistence path unchanged.
- Ship as advisory-only v1 with explicit authority guardrails.
- Correct roadmap wording later from “recommendation package” to evidence-first advisory package.

## Testing and Observability

### Frontend Verification

- `idle`, `generating`, `ready`, `stale`, and `failed` panel states render correctly
- stale artifacts never auto-regenerate on page load
- `Generate recommendation` and `Regenerate` trigger only explicit workflow calls
- guardrail banner and advisory copy remain visible in all non-idle states
- the copilot panel remains visually separate from the accept and reject controls

### Backend Verification

- only authorized chairs can access AI-006 routes
- `GET` never generates implicitly
- `generate` may reuse the current artifact when the fingerprint matches
- `regenerate` always creates a new run
- decision-relevant fingerprint changes mark the current artifact stale
- rebuttal-disabled submissions resolve rebuttal fields as `not_applicable`
- failed reruns do not delete the prior current artifact
- no hidden call path can trigger `updateSubmissionStatus`

### AI-Service Verification

- schema enforcement rejects or strips verdict-like output
- no accept, reject, lean, or probability language escapes into persisted fields
- sparse evidence yields bounded summarization rather than hallucinated certainty
- conditional rebuttal handling behaves correctly for enabled, absent, and disabled cases

### Observability

- one lightweight workflow log per run with:
  - `conference_id`
  - `submission_id`
  - trigger type
  - prior artifact state
  - fingerprint changed or unchanged
  - rebuttal applicability
  - run outcome
  - duration
- explicit stale or reuse reasons for:
  - cache hit or reused artifact
  - review-driven staleness
  - discussion-driven staleness
  - rebuttal-driven staleness
  - metadata or status-driven staleness
- do not log raw review text or discussion content into routine observability output
