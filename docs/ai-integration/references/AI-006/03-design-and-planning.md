# AI-006 Design And Planning

## Status

- State: design and planning baseline
- Last updated: 2026-03-31

## Accepted Runtime Split

- frontend renders AI-006 inside the existing `reviews` tab
- Go backend owns lookup, generate, regenerate, auth, aggregation, fingerprinting, and persistence
- `ai-service` owns typed artifact generation

## Accepted Persistence Model

- one current artifact per submission
- append-only lightweight run records
- all runs retained for the lifetime of the submission
- no run-history UI

## Accepted Lifecycle Rules

- explicit states: `idle | generating | ready | stale | failed`
- no silent regeneration on page load
- stale artifact stays readable until the chair explicitly regenerates
- failed refresh does not delete the last successful artifact

## Accepted Artifact Boundary

Typed sections:

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

Hard guardrails:

- no accept/reject recommendation
- no lean
- no acceptance probability
- no personalized chair steering input
- no autonomous status mutation

## Planning Artifacts

- Discovery:
  - [`docs/plans/2026-03-31-ai-006-chair-decision-copilot-discovery.md`](../../../plans/2026-03-31-ai-006-chair-decision-copilot-discovery.md)
- Design:
  - [`docs/plans/2026-03-31-ai-006-chair-decision-copilot-design.md`](../../../plans/2026-03-31-ai-006-chair-decision-copilot-design.md)
- PRD:
  - [`docs/plans/2026-03-31-ai-006-chair-decision-copilot-prd.md`](../../../plans/2026-03-31-ai-006-chair-decision-copilot-prd.md)
- Implementation spec:
  - [`docs/plans/2026-03-31-ai-006-chair-decision-copilot-implementation-spec.md`](../../../plans/2026-03-31-ai-006-chair-decision-copilot-implementation-spec.md)
- Implementation plan:
  - [`docs/plans/2026-03-31-ai-006-chair-decision-copilot.md`](../../../plans/2026-03-31-ai-006-chair-decision-copilot.md)
