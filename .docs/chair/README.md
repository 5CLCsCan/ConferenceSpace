# Chair Migration Steering Pack

Last updated: 2026-02-18
Scope: Chair role migration in `frontend-v2` (legacy reference: `frontend`)
Target workspace: `frontend-v2`

This pack is self-contained. A new session implementation agent should be able to execute chair migration without prior chat history.

## Document Index

1. `01-context-and-goals.md`
- Mission, constraints, scope boundaries, and success criteria.

2. `02-current-state-audit.md`
- Evidence-backed audit of legacy and current target state for chair flows.

3. `03-target-contract.md`
- Canonical chair route family, parameter rules, source-of-truth decisions, and migration boundaries.

4. `04-execution-plan.md`
- Iterative phase plan with tasks, dependencies, exit criteria, and deletion gates.

5. `05-file-mapping.md`
- Source-to-target file mapping with action per file (`copy/refactor/new/delete`).

6. `06-validation-cutover-rollback.md`
- Static checks, grep checks, smoke scenarios, signoff, cutover, rollback.

7. `07-risks-and-edge-cases.md`
- High-risk areas, mitigations, and locked decisions.

## How To Use This Pack

1. Read `01-context-and-goals.md` fully.
2. Treat `03-target-contract.md` as strict implementation contract.
3. Execute phases in order from `04-execution-plan.md`.
4. Use `05-file-mapping.md` while coding each phase.
5. Run all checks in `06-validation-cutover-rollback.md` before deleting anything.
6. Apply locked decisions in `07-risks-and-edge-cases.md` while implementing affected flows.

## Locked Assumptions

- No backend API changes are allowed for this migration.
- Chair canonical family is under `/role/chair/*`.
- `frontend-v2` keeps shared routes (`/role`, `/notifications`, `/profile/[user_id]`) as already implemented.
- Author and reviewer migration artifacts in `frontend-v2` remain stable unless explicitly listed as chair-coupling cleanup.

## Critical Rule

Do not ship chair migration with active links to legacy dashboard/public conference paths (`/dashboard/chair*`, `/dashboard/conference*`, `/conference/[id]`).
