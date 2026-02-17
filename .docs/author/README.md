# Author Migration Steering Pack

Last updated: 2026-02-17
Scope: Public + Shared + Author only
Target workspace: `frontend-v2`

This folder is self-contained. A new agent should be able to perform the migration without reading any other document.

## Document Index

1. `01-context-and-goals.md`
- Migration objective, constraints, hard decisions, and non-goals.

2. `02-current-state-audit.md`
- Exact current behavior and route/component/API inventory for public/shared/author.

3. `03-target-contract.md`
- Canonical route contract and behavior contract for `frontend-v2`.

4. `04-execution-plan.md`
- Step-by-step phased execution plan with deletion policy for legacy files.

5. `05-file-mapping.md`
- Source-to-target file mapping and per-file action details.

6. `06-validation-cutover-rollback.md`
- Verification checklist, grep checks, cutover sequence, rollback procedure.

7. `07-risks-and-edge-cases.md`
- Major migration risks, failure signals, and required mitigations.

## How To Use This Pack

1. Read `01-context-and-goals.md` fully.
2. Use `03-target-contract.md` as the strict source of truth.
3. Execute in order from `04-execution-plan.md`.
4. For each phase, use `05-file-mapping.md` to copy/refactor exact files.
5. Run checks from `06-validation-cutover-rollback.md` before deleting legacy files.
6. Review `07-risks-and-edge-cases.md` before each phase handoff.

## Scope Reminder

In this phase, do not migrate reviewer/chair features except the shared infrastructure needed by public/shared/author flows.

## Critical Rule

No backend API changes are allowed in this phase. Frontend must adapt to current endpoints.
