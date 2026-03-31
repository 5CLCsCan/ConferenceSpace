## Problem Statement

Review submission quality is currently gated by only minimal form validation. A reviewer can submit a draft that technically contains text in the required boxes but is still weak in ways that matter to an academic conference: recommendation and scores may not align, confidence may be overstated, severe criticism may be unsupported, and the review may ignore the paper's central claims or limitations.

That failure is expensive downstream. Chairs receive inconsistent or shallow reviews and must spend extra time interpreting whether a review is trustworthy before using it in decision-making.

The platform needs a reviewer-facing quality gate that improves review coherence before final submission without turning into a hidden recommendation engine or flattening reviewer voice.

## Solution

Add AI-010 as an assignment-scoped review quality and consistency auditor in the reviewer workflow.

The reviewer can receive advisory findings while drafting and a stricter pre-submit audit before final submission. The feature evaluates the current review payload using deterministic-first checks across consistency, justification, completeness, coverage, and optional conference policy rules. When available, AI-003 is used only as optional additional material to improve coverage checks.

The result is a structured audit response with actionable field-level findings. Blocking findings prevent a clean submit. Warning findings can be dismissed and that dismissal persists with the draft until the finding materially changes or reappears.

If the AI-010 workflow itself fails during submit enforcement, the system must clearly tell the reviewer that the audit did not complete and require explicit confirmation before allowing the submission to continue. That override is recorded for later visibility.

## User Stories

1. As a reviewer drafting a review, I want the system to point out contradictions between my scores, recommendation, confidence, and written comments so that I can correct them before submission.
2. As a reviewer saving a draft, I want advisory findings without being blocked from saving so that I can keep working while still receiving useful feedback.
3. As a reviewer attempting final submission, I want a focused pre-submit validation result so that I can see which issues are warnings and which issues actually block submission.
4. As a reviewer, I want blocking findings to be tied to specific review fields so that I know what to fix instead of guessing what failed.
5. As a reviewer, I want warning findings to be dismissible so that low-severity issues do not keep interrupting my drafting workflow once I have consciously accepted them.
6. As a reviewer, I want dismissed warnings to persist across reloads so that I do not have to repeatedly dismiss the same low-severity issue.
7. As a reviewer, I want a dismissed warning to reopen automatically if my review changes and the issue materially reappears so that the system does not hide newly relevant problems behind stale dismissals.
8. As a reviewer, I want the audit to use my current unsaved edits, not just my last saved draft, so that the findings match what I am actually about to save or submit.
9. As a reviewer who has generated AI-003, I want AI-010 to use that additional material only to check whether my review engages with the paper's key claims, limitations, and attention points, so that I get better coverage feedback without the system steering my conclusion.
10. As a reviewer who has not generated AI-003, I still want AI-010 to work so that review auditing does not depend on another AI workflow being available first.
11. As a reviewer, I want AI-010 to preserve my voice and reasoning style so that the feature improves quality without forcing a template-driven review style.
12. As a reviewer, I want AI-010 to avoid telling me what score or recommendation is correct so that the system remains a quality auditor rather than a hidden decision assistant.
13. As a reviewer, I want multiple distinct problems to be surfaced even if they target the same field so that the audit does not collapse separate issues into one vague message.
14. As a reviewer, I want clear messaging if the audit workflow fails during final submission so that I understand the risk instead of silently bypassing validation.
15. As a reviewer, I want the option to explicitly continue submitting after an audit failure so that workflow outages do not completely block me from meeting a deadline.
16. As a chair, I want later visibility when a review was submitted after AI-010 failed so that I can interpret the review with appropriate caution.
17. As a conference operator, I want durable backend records of audit-failed-but-user-confirmed submissions so that operational issues and workflow bypasses are inspectable later.
18. As a conference organizer with stricter review policy controls, I want optional policy-based checks to appear in the same audit flow so that conference-specific review standards can be enforced without inventing a second validator.
19. As a reviewer receiving a completeness finding, I want the system to distinguish between missing content and weak justification so that I know whether I need to add substance, not just more words.
20. As a reviewer receiving coverage findings, I want the system to focus on whether I addressed the paper's important claims and stated limits, not whether I agreed with them, so that the audit remains academically defensible.

## Implementation Decisions

- The feature is a full workflow integration, not a frontend-only validator.
- The reviewer workspace remains the primary surface; chair impact is downstream.
- A dedicated assignment-scoped audit API is introduced for draft-save and submit-preflight checks.
- Final submission still uses the existing review save route, but the backend reruns AI-010 before persisting a submitted review.
- The current unsaved review payload is the source input for every audit run.
- The audit contract uses three invocation modes: `draft_save`, `submit_preflight`, and `submit_enforcement`.
- Findings use a fixed field taxonomy and two severities only: `warning` and `blocking`.
- Warning dismissals persist with the assignment draft and reopen when the same finding code returns with a changed condition fingerprint.
- Dismissal state is backend-owned metadata, not part of the reviewer-authored review content.
- Browser-facing responses distinguish active findings from dismissed warnings after backend reconciliation.
- AI-003 is optional additional material only and may affect coverage checks only.
- If AI-010 fails during submit enforcement, the reviewer may explicitly continue submission, and that override is logged for later visibility.

## Testing Decisions

- Test externally visible behavior rather than internal implementation details.
- Verify that draft-save audit does not block persistence.
- Verify that submit enforcement blocks on blocking findings when the audit completes successfully.
- Verify that submit enforcement failure produces an explicit reviewer-confirmed override path rather than silent fail-open or unconditional fail-closed behavior.
- Verify that warning dismissals persist and reopen only when the condition fingerprint changes.
- Verify that AI-003-dependent coverage checks are skipped cleanly when AI-003 is absent.
- Verify that AI-003 never introduces verdict-like or recommendation-steering behavior into AI-010 findings.
- Verify that multiple findings can target the same field and render correctly.
- Verify that backend enforcement cannot be bypassed by skipping frontend preflight.
- Reuse existing assignment review, reviewer workflow, and AI workflow testing patterns as prior art.

## Out of Scope

- Evidence-linking or evidence-reference handling in AI-010 findings.
- Discussion-, rebuttal-, or chair-context-based audit rules in v1.
- Automatic rewriting of review prose.
- Suggesting the correct recommendation, score, or confidence level.
- A generalized cross-feature evidence system.
- A fully developed chair-facing UI for every audit override event in v1.
- Rich analytics dashboards for review audit history.

## Further Notes

- AI-010 should be treated as a workflow quality gate, not a recommendation assistant.
- The academic-platform context makes audit visibility and override logging materially important.
- The later evidence-handling sweep should be designed across features consistently rather than bolted onto AI-010 alone.
