# 04 - Post-Completion Legacy Cleanup Prompt

Use this prompt after a role migration passes validation and you want to clean legacy files safely.

## Fill These Inputs

- `ROLE`: `author` or `reviewer` or `chair`
- `ROLE_DOC_DIR`: e.g. `frontend/.docs/author`
- `LEGACY_DIR`: `frontend`
- `TARGET_DIR`: `frontend-v2`

## Copy-Paste Prompt

```text
You are performing post-migration legacy cleanup for ROLE=`<ROLE>`.

Inputs:
- Role docs: <ROLE_DOC_DIR>
- Legacy project: <LEGACY_DIR>
- Target project: <TARGET_DIR>

Objective:
Delete or prune obsolete legacy files/routes/components related to `<ROLE>` migration, with strict safety gates and traceability.

Rules:
1) Do not delete anything unless deletion gates are satisfied.
2) Use role docs as the authority for cleanup scope.
3) Keep cleanup scoped to migrated role and shared pieces already verified.
4) Preserve anything still required by unfinished role phases.
5) Avoid destructive shortcuts.

Required workflow:

Step 1 - Build cleanup candidate list
- Read cleanup sections in role docs.
- Produce a candidate table:
  - file path
  - why obsolete
  - replacement in `<TARGET_DIR>`
  - deletion gate status (Pass/Fail)

Step 2 - Prove replacement readiness (for each file)
- Verify replacement feature exists in `<TARGET_DIR>`.
- Verify route/component behavior is validated in prior checks.
- Verify no target references point to removed legacy routes.

Step 3 - Dependency safety scan
- Scan `<LEGACY_DIR>` and `<TARGET_DIR>` for references to each candidate.
- If references remain:
  - either migrate/update references
  - or defer deletion with explicit reason

Step 4 - Execute cleanup
- Delete only candidates with all gates passing.
- Keep deletions grouped logically (shared cleanup vs role cleanup).
- If needed, perform small supporting edits to remove dangling imports/references.

Step 5 - Post-cleanup verification
- Run lint/type checks for affected projects.
- Run grep checks for forbidden legacy route strings in `<TARGET_DIR>`.
- Run targeted smoke checks for `<ROLE>` and shared flows.

Step 6 - Cleanup report
- Produce a complete report of:
  - deleted files
  - deferred files
  - validation evidence
  - rollback notes

Deletion gates (must all pass for each file):
1) Equivalent behavior is working in `<TARGET_DIR>`.
2) No active references in `<TARGET_DIR>` to this legacy artifact.
3) Deletion does not break unfinished scopes.
4) Role docs allow cleanup at this phase.

Output format (must follow):

1) Cleanup Scope
- role and boundaries
- doc sections used as authority

2) Candidate Matrix
- one line per candidate:
  - path
  - gate status
  - action (Delete/Defer)
  - reason

3) Applied Deletions
- exact files deleted
- any supporting edits performed

4) Deferred Items
- path
- blocker
- condition for future deletion

5) Validation Results
- checks run + outcomes
- smoke flow outcomes

6) Rollback Guidance
- smallest rollback unit for this cleanup batch

If cleanup cannot proceed:
- return a "No-Safe-Deletion" report with explicit blockers.
```

