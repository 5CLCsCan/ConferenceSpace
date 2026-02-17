# 05 - Role Steering Doc Generation Prompt

Use this prompt to create a complete migration steering pack for a new role (for example `reviewer` or `chair`) from scratch.

## Fill These Inputs

- `ROLE`: `author` or `reviewer` or `chair`
- `ROLE_DOC_DIR`: e.g. `frontend/.docs/reviewer`
- `LEGACY_PLAN_DIR`: `frontend/.docs/.legacy`
- `LEGACY_DIR`: `frontend`
- `TARGET_DIR`: `frontend-v2`

## Copy-Paste Prompt

```text
You are preparing a role migration steering pack from scratch for ROLE=`<ROLE>`.

You must assume no existing shared/common migration documents are available, and the new-session implementation agent will rely only on the generated role docs.

Inputs:
- Requested role: <ROLE>
- Output directory: <ROLE_DOC_DIR>
- Legacy planning reference: <LEGACY_PLAN_DIR>
- Legacy codebase: <LEGACY_DIR>
- Current target codebase: <TARGET_DIR>

Goal:
Generate a complete, self-contained, implementation-ready documentation set for migrating `<ROLE>` safely and iteratively.

Primary grounding sources:
1) Current implementation state in `<TARGET_DIR>`
2) Legacy implementation in `<LEGACY_DIR>`
3) Legacy planning docs in `<LEGACY_PLAN_DIR>`

Non-negotiable standards:
1) Do not assume prior context. Every critical detail must be documented in the role pack.
2) Contracts must be explicit: canonical routes, params, source-of-truth components, and migration boundaries.
3) Plans must be executable phase-by-phase with validation gates.
4) Include cleanup and rollback instructions.
5) Clearly mark unresolved decisions and ask for user input in required format.

Required document set to generate in `<ROLE_DOC_DIR>`:
1) `README.md`
2) `01-context-and-goals.md`
3) `02-current-state-audit.md`
4) `03-target-contract.md`
5) `04-execution-plan.md`
6) `05-file-mapping.md`
7) `06-validation-cutover-rollback.md`
8) `07-risks-and-edge-cases.md`

If files already exist:
- update them in place to align with latest code reality.
- preserve useful content but remove contradictions.

Required workflow:

Step A - Evidence collection
- Inspect routes/pages/components/apis for:
  - requested role
  - relevant shared/public dependencies
  - cross-role coupling points that can affect migration order
- inspect `<LEGACY_PLAN_DIR>` docs and extract reusable constraints/decisions.
- inspect current state of `<TARGET_DIR>` to determine already migrated vs pending.

Step B - Current-state audit synthesis
- Build an explicit inventory of:
  - actual route topology (legacy + target)
  - duplicated implementations
  - conflicting path patterns
  - role-specific flow entry points
  - APIs used by role flows
- include precise file references.

Step C - Target contract design
- Define canonical route family for `<ROLE>`.
- Define route parameter naming standards.
- define source-of-truth components/pages where duplicates exist.
- define auth/session and shared-nav behavior for this role phase.
- define strict no-backend-change assumptions unless explicitly required.

Step D - Execution plan
- Create phased plan with:
  - objective per phase
  - concrete tasks
  - exit criteria
  - deletion gates
  - dependencies and sequencing
- include recommended migration order if role has sub-flows.

Step E - File mapping
- Provide source->target map table:
  - copy/refactor/new/delete actions
  - notes per file
- include external dependencies outside role folder.

Step F - Validation and rollback
- Define:
  - static checks
  - grep checks
  - smoke scenarios
  - final signoff criteria
  - rollback procedure

Step G - Risks and unknowns
- List high-risk edge cases and mitigations.
- List unresolved product/route decisions requiring user input.

Required unresolved decision format (exact):
> <Question>
- related components, screens, flows, etc.
- why you need this information
- how should i answer
- example answers

Decision quality rule:
- Ask only questions that are truly blocking or materially change implementation.
- If a decision can be inferred safely from code + existing docs, infer it and document the inference.

Required final output in your response:

1) Pack Summary
- files created/updated
- scope and assumptions

2) Key Contracts
- canonical route family
- source-of-truth decisions
- migration boundaries

3) Open Decisions
- include all unresolved questions using exact required format

4) Confidence and Gaps
- what is fully covered
- what remains risky despite current docs

Quality bar:
Your generated role docs must be sufficient for a new-session agent to implement migration without prior chat history.
```

