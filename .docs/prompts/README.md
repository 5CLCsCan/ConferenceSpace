# Migration Prompt Pack

Last updated: 2026-02-17

This folder contains copy-paste prompt templates for running role-by-role migration work with a fresh agent session that has no prior context.

## Files

1. `01-migration-execution.md`
- Execute migration for one role using that role's steering docs.

2. `02-quality-audit.md`
- Evaluate migrated implementation quality against steering docs.

3. `03-trace-debug-fix.md`
- Reproduce, trace, compare against legacy, and fix regressions.

4. `04-legacy-cleanup.md`
- Remove completed legacy files safely after successful migration.

5. `05-role-doc-generation.md`
- Generate a full steering pack for a requested role from scratch.

## Suggested Workflow

1. Run `01-migration-execution.md`.
2. Run `02-quality-audit.md`.
3. If defects exist, run `03-trace-debug-fix.md` (repeat until clean).
4. Run `04-legacy-cleanup.md`.
5. For the next role, run `05-role-doc-generation.md`.

## Required Inputs For Most Prompts

- `ROLE`: one of `author`, `reviewer`, `chair`
- `ROLE_DOC_DIR`: e.g. `frontend/.docs/author`
- `LEGACY_DIR`: `frontend`
- `TARGET_DIR`: `frontend-v2`
- `LEGACY_PLAN_DIR`: `frontend/.docs/.legacy` (used by doc-generation prompt)

## Notes

- These prompts assume backend API must remain unchanged unless explicitly overridden.
- These prompts are optimized for deterministic, tool-driven execution with explicit checkpoints.
