# AI-003 Design And Execution

## Corrected Runtime Split

- Browser-facing routes remain in the Go backend:
  - `POST /api/v1/conferences/{conference_id}/assignments/{assignment_id}/briefing/generate`
  - `GET /api/v1/conferences/{conference_id}/assignments/{assignment_id}/briefing`
- Internal workflow route in `ai-service` should be:
  - `POST /api/v1/workflows/reviewer-pre-read-briefing/resolve`
  - request action is `lookup` or `generate`
  - response status is `idle | ready | stale | failed`
- Ownership split:
  - Go backend: auth, assignment ownership, submission lookup, reviewer-safe manuscript loading, proxying
  - `ai-service`: manuscript extraction, normalization, cache lookup, artifact generation, final run persistence

## Corrected Execution Model

- AI-003 v1 is `synchronous + cache`
- Go `POST /generate` should:
  - return cached artifact immediately when fingerprint matches
  - otherwise forward the manuscript and reviewer-visible submission metadata into `ai-service`, run generation synchronously, and return the final artifact
- Go `GET /briefing` should expose stable body states:
  - `idle`
  - `ready`
  - `stale`
  - `failed`
- Internal `ai-service` resolve should:
  - return `idle | ready | stale | failed` on `lookup`
  - run generation only on `generate`
- `generating` is a client-local request-in-flight state in v1, not a persisted backend job state

## Corrected Cache Model

- Do not rely on `submission_version`; the backend does not have that field.
- Base identity: assigned submission plus current reviewer-visible submission state.
- Freshness identity: hash or state marker built from current reviewer-visible submission data plus internal extraction and prompt versions.
- Cached artifacts should be reusable only when the same manuscript state would yield the same neutral artifact.

## Corrected Artifact Shape

Minimum structured sections:

- `submission_snapshot`
- `claimed_contributions`
- `notable_elements`
- `reviewer_attention_points`
- `stated_scope_and_limitations`
- `guardrails`

Hard guardrails:

- no accept or reject recommendation
- no predicted score
- no publication-likelihood framing
- no discussion or rebuttal summaries
- wording should steer toward reviewer inspection, not decision anchoring

## Corrected Source Contract

- reviewer-visible submission metadata
- manuscript file bytes or a reviewer-safe manuscript payload
- optional internal extraction metadata
- no discussion context
- no rebuttal context
- no precheck context

Hard exclusions:

- author identity in `double-blind`
- chair-only notes or decision drafts
- hidden moderation state
- AI-002 verdict framing such as `desk_reject` or `manual_review`

## Rejected Earlier Assumptions

- Rejected: "pre-read" without ingesting the manuscript body
- Rejected: discussion and rebuttal as first-class AI-003 inputs
- Rejected: `submission_version` as an existing system field
- Rejected: process-context briefing as the meaning of AI-003

## Required Verification Boundary

- frontend card state and typed artifact rendering tests
- Go auth, manuscript-loading, and visibility-boundary tests
- `ai-service` route, extraction, cache, persistence, and bias-sanitization tests
- explicit verification that AI-003 does not inherit weaker submission file authorization paths

## Minimal V1 Rollout

- wire only the existing reviewer submission-detail AI card
- manual generation only
- synchronous request path with cache reuse
- no AI-001 chat integration
- no chair-side UI reuse
- no generalized workflow platform expansion
- no durable async worker model in v1
