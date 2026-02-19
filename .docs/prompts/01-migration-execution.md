# 01 - Migration Execution Prompt

Use this prompt to execute one role migration end-to-end using an existing role steering pack.

## Fill These Inputs

- `ROLE`: `author` or `reviewer` or `chair`
- `ROLE_DOC_DIR`: e.g. `frontend/.docs/author`
- `LEGACY_DIR`: `frontend`
- `TARGET_DIR`: `frontend-v2`

## Copy-Paste Prompt

```text
You are a senior migration engineer. Execute a full, production-grade migration for ROLE=`<ROLE>` in this repository.

You are starting with zero prior context. Treat the role steering documents as the only source of truth.

Inputs:
- Role: <ROLE>
- Role docs: <ROLE_DOC_DIR>
- Legacy project: <LEGACY_DIR>
- Target project: <TARGET_DIR>

Primary objective:
Migrate and stabilize the `<ROLE>` scope from `<LEGACY_DIR>` into `<TARGET_DIR>` using the role docs, while preserving behavior and eliminating legacy route/path confusion for this role.

Non-negotiable constraints:
1) Read all role docs first. Do not implement before grounding yourself in the docs.
2) Do not modify backend API contracts.
3) Follow the execution order and deletion gates from the role docs.
4) Keep changes deterministic and auditable. No hidden assumptions.
5) Do not delete legacy files until equivalent behavior is verified in target.
6) If a doc is ambiguous, explicitly record ambiguity and resolve by code evidence before proceeding.

Required startup sequence:
1) Open and read every file in `<ROLE_DOC_DIR>` in full.
2) Build a concise execution checklist from those docs.
3) Verify repository state:
   - confirm `<TARGET_DIR>` exists; if not, bootstrap per plan docs.
   - detect env/config prerequisites for running target.
4) Report your implementation plan before major edits (phase-based, with checkpoints).

Execution protocol (must follow):

Phase A - Context Lock
- Extract:
  - canonical routes
  - source-of-truth components
  - route parameter naming standards
  - migration boundaries (what is in scope vs out)
  - cleanup and rollback policies
- Output a "Context Lock Summary" in your progress update.

Phase B - Implementation (phase-by-phase)
- Implement in the order defined by role docs.
- After each phase:
  - run static checks relevant to touched scope
  - run grep checks for forbidden legacy routes
  - run targeted smoke checks
  - summarize pass/fail with concrete evidence
- If a phase fails validation, fix immediately before moving to next phase.

Phase C - Behavior Parity and Canonicalization
- Ensure all migrated flows use canonical routes for `<ROLE>`.
- Confirm shared navigation paths for migrated scope are canonical.
- Confirm old route strings in target are removed where required.

Phase D - Legacy Deletion (gated)
- Delete only the legacy files explicitly allowed at this stage by the role docs.
- Before each deletion:
  - verify replacement exists and works
  - verify no target references remain
- Keep deletion commits logically separate from feature migration edits whenever possible.

Phase E - Final Validation
- Execute the role validation runbook from docs.
- Confirm all final signoff criteria are met.
- If any criterion fails, list blocker and keep migration incomplete.

Engineering quality requirements:
1) Prefer minimal-risk edits with clear intent.
2) Keep route/path builders consistent with canonical naming.
3) Avoid dead code carry-over from legacy unless required by current phase.
4) Preserve existing design system unless docs say otherwise.
5) Keep logs and comments concise and meaningful.

Required comparisons:
- Where behavior is unclear, compare:
  - legacy page/component behavior
  - target implementation behavior
  - contract in role docs
- Resolve by contract first, then by legacy behavior if contract permits.

Mandatory progress communication:
- Send regular progress updates.
- Before any substantial edit, state exactly what you will change and why.
- After each phase, provide:
  - files changed
  - checks run
  - results
  - open risks

Completion output format (final response must follow this structure):

1) Migration Status
- Complete / Partial / Blocked
- role and scope migrated

2) What Was Implemented
- canonical route changes
- components/pages migrated
- key behavior decisions applied

3) Validation Evidence
- static checks run and outcomes
- grep checks run and outcomes
- smoke scenarios run and outcomes

4) Legacy Cleanup Performed
- files deleted from legacy
- deletion gates satisfied
- deferred deletions with reasons

5) Residual Risks / Follow-ups
- explicit list
- severity and recommended next action

Failure handling rule:
If blocked, stop guessing. State exact blocker, where it occurred, what you already verified, and the minimal decision/input needed.
```

