# AI-006 Chair Decision Copilot Discovery

## User Problem

Chairs already have the raw evidence needed for a decision, but it is split across separate tabs and UI blocks. For borderline, conflicted, or time-constrained cases, the chair must manually reconstruct the submission story from reviewer scores, rebuttal state, discussion context, and timeline history before making a final decision.

The real problem is synthesis effort, not lack of data and not lack of decision controls.

## Current System Reality

The chair submission detail page already loads most of the evidence package needed for AI-006 in one route:

- submission detail
- conference context
- reviews
- discussion threads and messages
- derived history events

Current runtime anchor:

- `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx`

The visible chair detail workspace splits that evidence into tabs:

- overview
- reviews
- discussion
- history

Current rendering anchor:

- `frontend/components/chair/conference-detail/submission-detail-content.tsx`

The current decision surface is embedded in the reviews tab and already supports only `accept` and `reject` persistence through explicit chair submission:

- `frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx`

This means AI-006 should attach to an existing decision workflow that already has the right human authority boundary. It should not invent a new decision path.

## Relevant Existing Modules

- Chair submission loader:
  - `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx`
- Chair detail shell:
  - `frontend/components/chair/conference-detail/submission-detail-content.tsx`
- Chair decision panel and rebuttal-aware review view:
  - `frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx`
- Discussion tab:
  - `frontend/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`
- History tab:
  - `frontend/components/chair/conference-detail/submission-detail/chair-history-tab.tsx`
- Existing review analytics client:
  - `frontend/lib/api/reviews.ts`
- Existing backend workflow precedent:
  - `backend/internal/controller/assignment/briefing.go`
  - `ai-service/app/workflows/reviewer_pre_read_briefing/*`

## Constraints

- AI-006 is advisory-only.
- The feature must not auto-submit or mutate submission status.
- The output must be evidence-only with no directional lean.
- Generated evidence packages persist and remain reusable until the underlying evidence changes.
- Persisted evidence packages are submission-scoped and shared across authorized chairs.
- Chairs can manually regenerate the package even when the evidence fingerprint has not changed.
- AI-006 stays a pure summarization workflow and does not accept chair-authored steering input.
- AI-006 v1 includes both computed analytics and reviewer narrative feedback synthesis.
- AI-006 uses a dedicated backend workflow route rather than client-side orchestration.
- AI-006 keeps lightweight per-run history internally while exposing only the latest shared artifact in the chair UI.
- The artifact fingerprint invalidates only on decision-relevant evidence changes.
- AI-006 lives in the existing reviews tab as a separate advisory panel above the decision controls.
- The artifact schema is sectioned and typed rather than a freeform blob.
- The overall solution shape is submission-scoped persisted workflow in the existing `reviews` tab.
- The browser-facing contract uses dedicated lookup, generate, and regenerate backend routes.
- Persistence is split between one current artifact record per submission and lightweight internal run history.
- Evidence fingerprinting is based on normalized decision-relevant source inputs plus prompt/schema versioning.
- Lifecycle is explicit and user-controlled; stale artifacts do not auto-regenerate on page load.
- Testing and observability focus on state transitions, stale reasons, and advisory-boundary enforcement.
- Chairs remain the sole authority for final decisions.
- The feature should reuse the existing chair detail context instead of adding a parallel workflow.

## Risks and Unknowns

- The roadmap text currently says `recommendation package`, which is too strong for the accepted boundary and should be corrected later.
- The current chair page mentions reviews, discussion, and history explicitly. Additional analytics should be derived from existing contracts first, not from a new analytics layer.
- If the generated package appears visually too close to the accept/reject controls, users may still treat it as a proxy decision even if the copy is cautious.
- Rebuttal is becoming conference-configurable, so rebuttal-derived metrics and invalidation rules must be conditional rather than universal.

## Initial Solution Direction

- add a distinct advisory copilot panel in the chair submission decision area
- keep it user-triggered via `Generate recommendation`
- generate an evidence package, not a recommendation
- persist the generated package behind an evidence-fingerprint cache and invalidate it when the evidence bundle changes
- scope persisted packages to the submission so all authorized chairs see the same current package
- allow manual `Regenerate` as an explicit override
- keep the workflow strictly evidence-derived with no personalized steering input
- include narrative synthesis from reviewer `summary`, `strengths`, `weaknesses`, and optional `questions`
- include computed analytics for review distribution, confidence, criteria extremes, discussion activity, review coverage, and conditional rebuttal signals
- execute lookup/generate/regenerate through a dedicated backend workflow route
- keep lightweight internal run history while showing only the latest artifact in the chair UI
- invalidate the shared artifact only when decision-relevant evidence changes
- place the copilot in the existing reviews tab above, but separate from, the final decision controls
- persist a typed artifact with explicit evidence, analytics, guardrails, and fingerprint fields
- place hard guardrails in both copy and runtime behavior so the copilot cannot write a decision or imply one
