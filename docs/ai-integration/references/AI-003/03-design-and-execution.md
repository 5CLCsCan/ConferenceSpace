# AI-003 Design And Execution

## Status

- State: shipped
- Last updated: 2026-03-31
- Purpose: summarize the delivered AI-003 execution baseline after implementation and verification.

## Shipped Runtime Split

- Browser-facing routes are in the Go backend:
  - `POST /api/v1/conferences/{conference_id}/assignments/{assignment_id}/briefing/generate`
  - `GET /api/v1/conferences/{conference_id}/assignments/{assignment_id}/briefing`
- Internal workflow route in `ai-service` is:
  - `POST /api/v1/workflows/reviewer-pre-read-briefing/resolve`
  - request action is `lookup` or `generate`
  - response status is `idle | ready | stale | failed`
- Ownership split:
  - Go backend: auth, assignment ownership, submission lookup, reviewer-safe manuscript loading, proxying
  - `ai-service`: manuscript extraction, normalization, cache lookup, artifact generation, final run persistence

## Shipped Execution Model

- AI-003 v1 is shipped as `synchronous + cache`
- Go `POST /generate`:
  - returns cached artifact immediately when fingerprint matches
  - otherwise forwards manuscript bytes plus reviewer-visible submission metadata into `ai-service`, runs generation synchronously, and returns the final artifact
- Go `GET /briefing` exposes stable body states:
  - `idle`
  - `ready`
  - `stale`
  - `failed`
- Internal `ai-service` resolve:
  - returns `idle | ready | stale | failed` on `lookup`
  - runs generation only on `generate`
- `generating` is a client-local request-in-flight state in v1, not a persisted backend job state

## Shipped Cache Model

- AI-003 does not rely on `submission_version`.
- Base identity is the assigned submission plus current reviewer-visible submission state.
- Freshness identity is `submission_state_fingerprint`, built from current reviewer-visible submission data and file metadata.
- Cached artifacts are reusable only when the same manuscript state would yield the same neutral artifact.

## Shipped Artifact Shape

Shipped structured sections:

- `submission_snapshot`
- `claimed_contributions`
- `notable_elements`
- `reviewer_attention_points`
- `stated_scope_and_limitations`
- `guardrails`
- `review_readiness_signals`

Hard guardrails:

- no accept or reject recommendation
- no predicted score
- no publication-likelihood framing
- no discussion or rebuttal summaries
- wording should steer toward reviewer inspection, not decision anchoring

## Shipped Source Contract

- reviewer-visible submission metadata
- manuscript file bytes or reviewer-safe manuscript payload
- assignment-scoped action `lookup | generate`
- `submission_state_fingerprint`
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

## Verification Boundary

- frontend card state and typed artifact rendering tests
- Go auth, manuscript-loading, and visibility-boundary tests
- `ai-service` route, extraction, cache, persistence, and bias-sanitization tests
- live reviewer-screen browser smoke validation

## Delivered V1 Boundary

- wire only the existing reviewer submission-detail AI card
- manual generation only
- synchronous request path with cache reuse
- no AI-001 chat integration
- no chair-side UI reuse
- no generalized workflow platform expansion
- no durable async worker model in v1
