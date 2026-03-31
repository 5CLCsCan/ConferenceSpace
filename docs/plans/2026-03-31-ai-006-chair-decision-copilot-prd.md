## Problem Statement

Chairs already have the information needed to decide a submission, but the evidence is fragmented across reviews, rebuttal signals, discussion, and history. For difficult or borderline cases, the chair must manually reconstruct the case before making a final decision. This slows decision-making, increases cognitive load, and makes it harder to produce a disciplined rationale from the evidence already in the system.

## Solution

Add an advisory-only Chair Decision Copilot inside the existing submission `reviews` tab. The copilot generates a persisted, submission-scoped evidence package from current chair-visible data and reuses it until decision-relevant evidence changes. The artifact summarizes evidence, highlights disagreement, surfaces derived analytics, and drafts a suggested chair note, but it never recommends accept or reject and never mutates submission state.

## User Stories

1. As a chair, I want to generate a single evidence package from reviews, discussion, rebuttal, and history, so that I do not have to manually reconstruct the submission case across tabs.
2. As a chair, I want the copilot to stay advisory-only, so that final authority clearly remains with me.
3. As a chair, I want the copilot to live in the existing `reviews` tab, so that I can use it in the same place where I review evidence and submit a decision.
4. As a chair, I want to explicitly click `Generate recommendation`, so that the system does not silently act on my behalf.
5. As a chair, I want a shared artifact for the submission, so that co-chairs see the same evidence package derived from the same data.
6. As a chair, I want the package reused while the evidence is unchanged, so that I get a stable result across revisits and avoid unnecessary reruns.
7. As a chair, I want a manual `Regenerate` action, so that I can force a fresh run when needed without waiting for an evidence change.
8. As a chair, I want stale artifacts clearly marked, so that I know when new reviews, discussion, or rebuttal activity may have changed the case.
9. As a chair, I want rebuttal-related sections to disappear cleanly when rebuttal is disabled or absent, so that missing rebuttal is not misrepresented as a negative signal.
10. As a chair, I want reviewer narrative feedback included, so that the copilot reflects the substance of reviewer reasoning rather than only score summaries.
11. As a chair, I want disagreement surfaced explicitly, so that divergent reviewer positions are easy to inspect before making a decision.
12. As a chair, I want the copilot to keep showing the last successful artifact if a refresh fails, so that I do not lose context mid-decision.
13. As a chair, I want the copilot to show guardrails and advisory copy in every meaningful state, so that the feature does not imply decision authority.
14. As a co-chair, I want to read the same current artifact as other chairs, so that we collaborate from a shared evidence baseline.
15. As an operator, I want internal run history retained for the life of the submission, so that failed refreshes and suspicious outputs remain auditable.
16. As a developer, I want a dedicated backend route for lookup, generate, and regenerate, so that auth, aggregation, persistence, and fingerprinting stay out of the client.
17. As a developer, I want rebuttal applicability and stale reasons logged without raw review text, so that operations remain observable without leaking sensitive content.

## Implementation Decisions

- The feature remains submission-scoped and review-tab-scoped rather than introducing a new AI workspace.
- The generated artifact is typed and sectioned, not a freeform markdown blob.
- The backend owns chair authorization, evidence aggregation, fingerprinting, persistence, and AI workflow orchestration.
- The AI workflow remains evidence-only and explicitly disallows verdict-like outputs.
- Persistence is split between a current artifact record and append-only lightweight run records.
- Fingerprinting uses normalized decision-relevant evidence plus prompt/schema versioning.
- Rebuttal metrics are conditional and resolve to `not_applicable` when rebuttal is disabled or absent.
- The UI exposes `Generate recommendation` and `Regenerate`, but never triggers generation implicitly on page load.
- Failed refreshes do not replace or delete the last successful readable artifact.

## Testing Decisions

- Test external behavior, not internal component structure.
- Frontend tests should assert state rendering, button behavior, stale handling, and visible guardrails.
- Backend tests should assert authorization, explicit route semantics, fingerprint reuse, stale detection, and no automatic decision mutation.
- AI-service tests should assert schema enforcement, non-directional output, sparse-evidence handling, and rebuttal conditionality.
- Prior art exists in the reviewer briefing workflow across frontend API clients, backend handlers, and ai-service workflow tests.

## Out of Scope

- Accept/reject recommendation, lean, probability, or score prediction.
- Automatic decision submission or status mutation.
- Personalized chair prompts.
- UI for historical run browsing.
- New top-level tab or separate AI-006 workspace.

## Further Notes

- The roadmap wording should eventually be corrected from “recommendation package” to an evidence-first advisory package.
- The existing platform chatbot remains the place for personalized chair exploration or freeform discussion.
