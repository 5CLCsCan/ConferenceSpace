# AI-010 Review Quality and Consistency Auditor Discovery

## User Problem

A reviewer can complete a draft review that looks superficially complete but is still weak in ways that matter to the conference: scores and recommendation may not align, confidence may be overstated, required narrative sections may be shallow, and core submission claims may never be addressed in the written review.

Today that burden is pushed downstream to chairs, who then have to interpret inconsistent or poorly justified reviews during decision-making. The real problem is not missing review controls. It is missing pre-submit quality validation inside the reviewer workflow.

## Current System Reality

The reviewer review flow already exists and persists both draft and submitted review states:

- `frontend/components/reviewer/submission-review.tsx`
- `frontend/hooks/use-assignment-review.ts`
- `frontend/lib/api/reviews.ts`

The current review screen already captures:

- five criterion scores
- overall recommendation
- confidence
- summary
- strengths
- weaknesses
- optional questions

The current submit path only performs minimal frontend validation before persistence:

- recommendation must be present
- `summary`, `strengths`, and `weaknesses` must be non-empty

That means AI-010 is not filling a nonexistent flow. It is tightening an existing review submission path that currently lacks consistency or justification checks.

It also means AI-010 should not absorb basic form validation responsibilities. Missing required fields, invalid score ranges, and malformed submit payloads belong in normal UI and backend validation, not in the semantic audit workflow itself.

AI-003 already exists as a reviewer-side structured pre-read artifact in the same review workspace:

- `frontend/components/reviewer/submission-review/review-sidebar.tsx`
- `frontend/hooks/use-assignment-briefing.ts`
- `docs/ai-integration/AI-003-reviewer-pre-read-briefing.md`

This matters because AI-010 does not need to invent paper understanding from scratch. It can reference the neutral AI-003 artifact for coverage checks, as long as that reference stays descriptive rather than evaluative.

Conference configuration machinery exists in the repo, but the current reviewer-quality enforcement contract is not clearly modeled yet. Existing visible policy/config surfaces are centered more around submission policy and review-process setup than reviewer-quality gating:

- `frontend/components/wizard/creation/types.ts`
- `frontend/components/wizard/creation/steps/policy-guidelines.tsx`
- `frontend/components/wizard/creation/steps/final-review.tsx`

So "strict enforcement from review policy" is a real future dependency, not a current system guarantee.

## Relevant Existing Modules

- Reviewer review page and submit handlers:
  - `frontend/components/reviewer/submission-review.tsx`
- Review persistence hook:
  - `frontend/hooks/use-assignment-review.ts`
- Review API contracts:
  - `frontend/lib/api/reviews.ts`
- AI-003 reviewer pre-read UI:
  - `frontend/components/reviewer/submission-review/review-sidebar.tsx`
- AI-003 client hook:
  - `frontend/hooks/use-assignment-briefing.ts`
- AI integration roadmap entry:
  - `docs/ai-integration.md`
- AI-003 canonical lifecycle record:
  - `docs/ai-integration/AI-003-reviewer-pre-read-briefing.md`
- Conference policy/configuration surfaces that may later shape strictness:
  - `frontend/components/wizard/creation/types.ts`
  - `frontend/components/wizard/creation/steps/policy-guidelines.tsx`

## Constraints

- AI-010 must attach to the existing reviewer review workflow instead of creating a parallel review process.
- The primary actor is the reviewer; chairs benefit indirectly from better review quality.
- The feature should run on draft save and submit attempt, but only submit-time checks should be allowed to block final submission.
- AI-010 should remain a quality gate, not a recommendation engine for the paper.
- AI-010 should preserve reviewer voice and avoid over-standardizing review style.
- AI-010 should output actionable findings tied to concrete review fields, not a rewritten review.
- AI-003 may be used only as neutral structured context for coverage and traceability checks.
- v1 should not depend on discussion, rebuttal, other reviewers' comments, or chair-only context.
- The platform still needs baseline UI and backend validation even if AI-010 is unavailable or policy controls are not yet fully modeled.

## Risks and Unknowns

- The largest product risk is authority drift: if AI-010 starts implying what score or recommendation the reviewer should give, the feature becomes a hidden decision aid rather than a review-quality auditor.
- The second major risk is style normalization. If the system behaves like a prose template enforcer, it will reduce reviewer trust and flatten authentic expert feedback.
- The current review-policy model in the repo does not yet expose a clear contract for strict reviewer-quality enforcement, so policy-based blocking rules need explicit design later.
- AI-003 quality matters for some coverage checks. If the pre-read artifact misses core claims due to extraction weakness, downstream AI-010 coverage alerts may be noisy.
- Draft-save feedback can become nuisance noise if the system raises too many low-value warnings before the reviewer is actually trying to submit.

## Initial Solution Direction

- Treat AI-010 as an LLM-driven semantic review-quality workflow integrated into the existing reviewer draft and submit path.
- Keep the current review payload as the primary source of truth.
- Use AI-003 only to verify whether the written review meaningfully engages with the submission's central claims, limitations, and attention points.
- Keep basic form integrity outside AI-010:
  - frontend should catch missing required fields and invalid local state early
  - backend should revalidate request schema and submit invariants before invoking `ai-service`
- Use AI-010 to evaluate the parts that are actually semantic:
  - internal consistency between scores, recommendation, confidence, and narrative text
  - justification quality for important judgments
  - coverage of core paper issues and claimed contributions
  - completeness of reviewer reasoning, not just raw field presence
- Return a structured audit result with field-level findings and clear remediation guidance.
- Keep draft-save results advisory and lightweight.
- Keep submit-attempt results explicit and severity-grouped, but reserve blocking behavior for explicit policy-backed or platform-defined enforcement rather than heuristic math rules.
- Keep rewrite assistance, tone normalization, and generic review templating out of scope for this feature.
