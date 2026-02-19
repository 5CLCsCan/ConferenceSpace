# Reviewer Migration Steering Pack

Last updated: 2026-02-18
Scope: Reviewer role migration in `frontend-v2` (legacy reference: `frontend`)
Target workspace: `frontend-v2`

This pack is self-contained. A new session implementation agent should be able to execute reviewer migration without prior chat history.

## Document Index

1. `01-context-and-goals.md`
- Mission, constraints, scope boundaries, and success criteria.

2. `02-current-state-audit.md`
- Evidence-backed audit of legacy and current target state for reviewer flows.

3. `03-target-contract.md`
- Canonical reviewer route family, parameter rules, source-of-truth decisions, and migration boundaries.

4. `04-execution-plan.md`
- Iterative phase plan with tasks, dependencies, exit criteria, and deletion gates.

5. `05-file-mapping.md`
- Source-to-target file mapping with action per file (`copy/refactor/new/delete`).

6. `06-validation-cutover-rollback.md`
- Static checks, grep checks, smoke scenarios, signoff, cutover, rollback.

7. `07-risks-and-edge-cases.md`
- High-risk areas, mitigations, locked decisions, and unresolved-decision policy.

## How To Use This Pack

1. Read `01-context-and-goals.md` fully.
2. Treat `03-target-contract.md` as strict implementation contract.
3. Execute phases in order from `04-execution-plan.md`.
4. Use `05-file-mapping.md` while coding each phase.
5. Run all checks in `06-validation-cutover-rollback.md` before deleting anything.
6. Apply risk controls in `07-risks-and-edge-cases.md` while implementing affected flows.

## Locked Assumptions

- No backend API changes are allowed for this migration.
- Reviewer canonical family is under `/role/reviewer/*`.
- Reviewer execution source-of-truth is `SubmissionReviewScreen` (`submission-review/*` stack), not `PaperReview`.
- Assignment deep links must auto-resolve `conferenceId` through resolver chain, and render explicit unresolved state only if all resolution paths fail.
- Existing `frontend-v2` author/chair/shared routes remain stable unless explicitly listed as reviewer-coupling updates.

## Critical Rule

Do not ship reviewer migration with active links to legacy reviewer routes (`/dashboard/reviewer*`, `/dashboard/conference/*/reviewer/*`) or query-tab reviewer navigation (`?tab=conferences`, `?tab=invitations`, `?tab=conference-papers`).
