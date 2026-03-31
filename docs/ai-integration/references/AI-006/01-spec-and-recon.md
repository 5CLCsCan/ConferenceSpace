# AI-006 Spec And Recon

## Status

- State: research baseline feeding the locked AI-006 design.
- Last updated: 2026-03-31

## Roadmap Scope

AI-006 is a chair-facing workflow integration for decision support. Its value is in synthesizing evidence that is already present in the chair submission detail flow, not in making or committing decisions. Chairs remain the sole authority to accept or reject.

The accepted reset from this planning cycle is important:

- AI-006 is evidence synthesis, not recommendation.
- AI-006 is a persisted workflow, not just chat behavior.
- AI-006 is shared per submission, not personalized per chair.

## Recon Constraints

- Chair decision work already happens in a single submission detail surface with `overview`, `reviews`, `discussion`, and `history`.
- The current persisted decision path already enforces the right authority boundary: explicit chair-owned `accept` and `reject`.
- Review analytics already exist in the current frontend contract and can be reused rather than re-invented.
- Reviewer narrative feedback matters as much as metrics, so AI-006 must synthesize both.
- Rebuttal is becoming conference-configurable, which means rebuttal-derived signals must be conditional rather than mandatory.
- Silent regeneration would undermine the explicit human-control boundary and is therefore out of scope.

## Locked V1 Scope

- entry point is the existing chair submission `reviews` tab
- generation is manual only
- output is evidence-only and typed
- artifact is submission-scoped and shared across authorized chairs
- current artifact persists until decision-relevant evidence changes
- manual `Regenerate` exists even without evidence change
- run history is internal-only and retained for the submission lifetime
- no verdict-like output fields are allowed
