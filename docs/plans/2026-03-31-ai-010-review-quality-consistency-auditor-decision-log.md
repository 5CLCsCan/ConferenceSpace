# AI-010 Review Quality and Consistency Auditor Decision Log

- Date: 2026-03-31
- Topic: ai-010-review-quality-consistency-auditor
- Owner: Codex with user review

## Decisions

### D-001
- Question: Who is the primary user for AI-010?
- Decision: The primary actor is a reviewer who has just completed a draft review for an assigned submission. The chair is a downstream beneficiary of improved review quality, not the primary in-flow operator.
- Why: The trigger is draft save and submit attempt inside the reviewer review workspace, and the immediate problem is preventing reviewers from submitting weak or self-contradictory reviews.
- Alternatives Rejected: Chair-first audit flow; post-submission chair-only quality review.
- Follow-up: Keep the primary UX inside the reviewer submission review screen and treat any chair-facing visibility as secondary.

### D-002
- Question: When should the auditor run and how hard should it enforce?
- Decision: Run on both draft save and submit attempt, but with different authority levels. Draft save produces soft advisory feedback; submit attempt can surface blocking validation when required checks fail.
- Why: Reviewers need early guidance while writing, but hard gating only makes sense at the point where the system is about to accept a final review submission.
- Alternatives Rejected: Submit-only validation; hard blocking on every draft save; passive analytics with no pre-submit enforcement.
- Follow-up: Define which findings are advisory versus blocking in the later design and PRD stages.

### D-003
- Question: What exact inputs should AI-010 receive in v1?
- Decision: AI-010 should receive the reviewer draft review payload, optional conference review-policy controls when available, and the AI-003 reviewer pre-read artifact as optional additional material when it exists for the same assignment.
- Why: These inputs are enough to detect contradictions, missing justification, and missing engagement with the submission's central claims without dragging in unrelated process context, while keeping AI-010 independent from AI-003 availability.
- Alternatives Rejected: Review text only; AI-003 only; discussion or rebuttal context in v1; other reviewers' reviews; chair-only context.
- Follow-up: Keep the request contract tightly scoped to assignment-local reviewer-visible data.

### D-004
- Question: How is AI-003 allowed to influence AI-010?
- Decision: AI-003 is a neutral coverage reference only. It can help determine whether the review meaningfully engages with the paper's core claims, limitations, and attention points, but it must not steer scores, recommendation, or acceptance posture.
- Why: Using AI-003 as a verdict anchor would turn a quality gate into an automation-bias mechanism and would violate the neutral boundary already established for AI-003.
- Alternatives Rejected: Letting AI-003 influence predicted recommendation; letting AI-003 infer what the reviewer should conclude.
- Follow-up: The later contract should explicitly prohibit AI-003-driven recommendation language.

### D-005
- Question: How should AI-010 evaluate the review?
- Decision: The primary evaluation logic should be deterministic and rule-driven, with narrow structured checks that compare review coverage against AI-003. It should not be a freeform "AI judges your review" pass.
- Why: This feature is a workflow quality gate in a core review path. Deterministic behavior is more inspectable, testable, and defensible than broad subjective generation.
- Alternatives Rejected: Pure LLM judgment with vague rationale; opaque model-only scoring; style-only linting.
- Follow-up: Define rule categories later, including score-to-recommendation consistency, confidence-to-text consistency, minimum evidence coverage, and policy-based enforcement.

### D-006
- Question: What should the auditor output?
- Decision: Output a structured audit result with an overall status such as `pass`, `warn`, or `block`, plus a list of findings that identify severity, affected field, explanation, and suggested remediation.
- Why: The reviewer needs actionable feedback tied to the actual form fields, not a rewritten review or an unstructured essay about quality.
- Alternatives Rejected: Rewritten review text; single opaque quality score; freeform markdown critique.
- Follow-up: Finalize the audit response schema and map findings back to the reviewer form fields.

### D-007
- Question: How should the auditor present findings in the reviewer UI?
- Decision: On draft save, present compact non-blocking hints near the review workflow. On submit attempt, present a focused pre-submit validation panel grouped by severity and linked back to the relevant fields.
- Why: Draft-time feedback should be lightweight and non-disruptive, while submit-time feedback must be explicit enough to resolve blocking issues before final submission.
- Alternatives Rejected: Full modal interruption on every save; hidden logs; chair-only review of findings after submission.
- Follow-up: Later design should decide whether hints live in the sidebar, footer, or near the submit controls.

### D-008
- Question: Should AI-010 rewrite or normalize reviewer prose?
- Decision: No. AI-010 should preserve reviewer voice and only identify inconsistency, missing support, missing coverage, or policy violations.
- Why: The core product risk called out for AI-010 is over-standardized review style. Rewriting pushes the feature in exactly that direction.
- Alternatives Rejected: Auto-rewrite suggestions as the default output; style normalization; generic review templates as enforcement.
- Follow-up: If rewrite assistance is ever explored later, it should be a separate opt-in assistive feature, not part of the validator itself.

### D-009
- Question: How should conference review policy affect AI-010?
- Decision: Review-policy controls are optional for v1. AI-010 should work with baseline consistency checks without them, and only add stricter enforcement when explicit conference policy or rubric controls exist.
- Why: The repo already has conference-configuration surfaces, but current review-policy modeling does not yet expose a clear assignment-time audit contract for reviewer-quality enforcement.
- Alternatives Rejected: Blocking AI-010 on a fully built policy system; pretending policy strictness already exists in the current review flow.
- Follow-up: Discovery and later design should call out the policy contract as a dependency gap, not as assumed existing infrastructure.

### D-010
- Question: Where should the AI-010 workflow live?
- Decision: AI-010 will ship as a full `frontend -> Go backend -> ai-service` workflow from v1. The frontend triggers and renders the audit, the Go backend owns auth and enforcement, and `ai-service` owns the typed audit workflow.
- Why: This fits the repo's existing AI workflow pattern, keeps submit-time enforcement server-side, and leaves room for deterministic-first auditing plus AI-003-assisted coverage checks without overloading the reviewer page or inventing a second validation stack.
- Alternatives Rejected: Frontend-only validation; Go-only validator with no dedicated workflow boundary.
- Follow-up: Lock the exact API surface next, including whether draft-save and submit-time audit share one resolve-style route or use separate invocation paths.

### D-011
- Question: What should the browser-facing API shape be?
- Decision: Add a dedicated assignment-scoped review-audit endpoint and keep review persistence on the existing review save route. The frontend may call the audit endpoint explicitly for draft hints and submit preflight, but the backend must also re-run AI-010 during final submit so enforcement cannot be bypassed.
- Why: This keeps audit behavior inspectable and reusable without collapsing validation and persistence into one opaque route. It also preserves server-owned enforcement while keeping the reviewer UI responsive.
- Alternatives Rejected: Folding audit into the existing save route; creating a separate final-submit route that duplicates persistence behavior.
- Follow-up: Lock the exact request and response schema next, including action mode and how findings map back to fields.

### D-012
- Question: Should AI-010 include evidence-linking references in its initial finding schema?
- Decision: No. V1 should omit `evidence_refs` and focus on clear field-level findings and remediation messages only.
- Why: Evidence handling is a broader platform concern and should be implemented consistently across features later. Adding partial evidence-reference structure now would create premature contract complexity without real evidence infrastructure behind it.
- Alternatives Rejected: Adding provisional evidence-reference arrays in v1; inventing ad hoc evidence-link formatting just for AI-010.
- Follow-up: Keep the finding schema lean now and reserve evidence-linking for a later cross-feature evidence pass.

### D-013
- Question: Should warning-level findings be dismissible in v1?
- Decision: Yes. Warning findings should be dismissible in v1. Blocking findings remain non-dismissible.
- Why: AI-010 needs usable reviewer-facing depth even in MVP form. If every warning is permanently sticky, the feature becomes noisy and less credible during drafting. Dismissible warnings let reviewers acknowledge lower-severity issues without diluting hard submission gates.
- Alternatives Rejected: Non-dismissible warnings in v1; dismissible blocking findings.
- Follow-up: Lock the dismissal lifecycle next, especially whether dismissal state is page-session only or persists with the draft and when a dismissed warning should re-open after the review changes.

### D-014
- Question: How long should dismissed warning state last?
- Decision: Dismissed warnings should persist with the assignment draft and automatically reopen when a later audit rerun determines that the finding has materially changed or reappeared.
- Why: Session-only dismissal is too shallow for a serious reviewer workflow. Persisting with the draft respects reviewer intent across reloads, while automatic reopening prevents stale dismissals from masking newly relevant issues.
- Alternatives Rejected: Session-only dismissal; permanent dismissal with no reopen behavior.
- Follow-up: Lock where dismissal state lives and define the exact reopen trigger, likely using a stable finding code plus condition fingerprint rather than raw message text.

### D-015
- Question: Where should dismissed warning state be stored?
- Decision: Store dismissal state in backend-owned assignment-scoped audit metadata, separate from `review_data` and separate from `ai-service` workflow storage.
- Why: The Go backend already owns assignment authorization, draft lifecycle, and submit-time enforcement. Dismissal state belongs with that lifecycle, but it must not pollute the reviewer-authored review payload. Keeping it outside `ai-service` also avoids making workflow internals the source of truth for reviewer acknowledgment state.
- Alternatives Rejected: Embedding dismissal state inside `review_data`; persisting dismissal state only in `ai-service`.
- Follow-up: Define the metadata shape next, including stable finding identity and condition fingerprint fields used for automatic reopen behavior.

### D-016
- Question: How should AI-010 identify findings and determine whether a dismissed warning should reopen?
- Decision: Each finding will carry a stable `code` plus a `condition_fingerprint`. Dismissal metadata will store that pair along with dismissal timestamps. A warning is considered reopened when the same `code` returns with a different `condition_fingerprint`.
- Why: Raw message text is too unstable to key lifecycle behavior. A stable finding code plus condition fingerprint gives the system a defensible way to preserve dismissals while reopening materially changed warnings.
- Alternatives Rejected: Keying dismissal state by message text; keying only by field name; permanent dismissal keyed only by code.
- Follow-up: Lock the full finding schema next, including severity and field mapping conventions for frontend rendering and backend enforcement.

### D-017
- Question: What should the v1 audit result and finding schema look like?
- Decision: Use a two-tier severity model only. The audit result returns `status` as `pass`, `warn`, or `block`. Each finding returns `code`, `severity`, `field`, `message`, `suggestion`, and `condition_fingerprint`. Finding severity is limited to `warning` or `blocking`.
- Why: This is the smallest contract that still supports reviewer usability, dismissal behavior, and submit-time enforcement. Adding a third `info` tier now would create noise without changing product behavior.
- Alternatives Rejected: Freeform critique payloads; single opaque audit score; a three-tier `info/warning/blocking` model in v1.
- Follow-up: Lock the field taxonomy next and confirm whether multiple findings may target the same field in one audit response.

### D-018
- Question: What field taxonomy should AI-010 use, and can multiple findings target the same field?
- Decision: Use a fixed v1 field taxonomy of `review`, `recommendation`, `confidence`, `summary`, `strengths`, `weaknesses`, `questions`, and the five criteria fields `criteria.originality`, `criteria.technical_quality`, `criteria.clarity`, `criteria.significance`, and `criteria.methodology`. Multiple findings may target the same field in one audit response.
- Why: The frontend and dismissal lifecycle need a stable, bounded field set. Allowing multiple findings per field avoids collapsing distinct problems into one vague warning.
- Alternatives Rejected: Freeform field paths; single finding per field; field targets inferred only from message text.
- Follow-up: Lock the audit modes next so draft-save, submit preflight, and submit enforcement produce the right severity behavior under one contract.

### D-019
- Question: How should AI-010 distinguish draft-time auditing from submit-time enforcement?
- Decision: Use one audit contract with three explicit invocation modes: `draft_save`, `submit_preflight`, and `submit_enforcement`. The same underlying rule engine runs in all three modes, but only `submit_enforcement` has authority to reject final submission.
- Why: This preserves one coherent rule system while allowing draft UX, pre-submit UX, and backend enforcement to use the workflow differently without duplicating logic.
- Alternatives Rejected: Separate draft and submit validators; implicit mode inference from route only; frontend-only preflight with no backend enforcement rerun.
- Follow-up: Lock the rule categories next so the workflow boundary is complete enough to design backend and frontend module responsibilities cleanly.

### D-020
- Question: What rule categories should AI-010 support in v1?
- Decision: AI-010 v1 will use five rule categories: `consistency`, `justification`, `coverage`, `completeness`, and optional `policy`.
- Why: These categories cover the actual review-quality problems the feature is meant to catch without sprawling into stylistic or recommendation-oriented behavior. They also cleanly separate deterministic audit concerns from future policy strictness.
- Alternatives Rejected: Style-only linting; a single undifferentiated finding pool with no semantic grouping; discussion- or rebuttal-based rules in v1.
- Follow-up: Lock the AI-003 usage boundary inside the `coverage` category next so the workflow cannot drift into verdict guidance.

### D-021
- Question: Is AI-003 required input for AI-010 coverage checks?
- Decision: No. AI-003 is optional additional material for AI-010. When present, it can improve coverage checks; when absent, AI-010 must still run using the review payload and any available policy context.
- Why: AI-010 should not be blocked on AI-003 generation state. The review auditor's primary source of truth is the reviewer draft itself, with AI-003 acting only as additive context.
- Alternatives Rejected: Making AI-003 mandatory for every audit run; skipping coverage checks entirely when AI-003 is unavailable.
- Follow-up: Lock the exact AI-003 usage boundary next, including what coverage checks degrade gracefully when the artifact is absent.

### D-022
- Question: What exact boundary governs AI-003 usage inside AI-010?
- Decision: AI-003 may only be used for optional additional `coverage` checks, specifically whether the review engages with claimed contributions, stated scope or limitations, and reviewer attention points surfaced in AI-003. If AI-003 is absent, those specific checks are skipped while the rest of AI-010 still runs. AI-003 must never be used to infer the correct recommendation, score, confidence, or conclusion.
- Why: This keeps AI-003 in a narrow, defensible role as a neutral coverage map and prevents AI-010 from drifting into hidden review steering or verdict guidance.
- Alternatives Rejected: Using AI-003 as a scoring anchor; using AI-003 to suggest the right recommendation; blocking AI-010 when AI-003 is unavailable.
- Follow-up: Run a design-readiness pass next to identify remaining undefined behavior before PRD writing.

### D-023
- Question: What happens if AI-010 submit enforcement fails due to workflow unavailability, timeout, or invalid response?
- Decision: Do not block submission completely. The reviewer must be clearly notified that the AI-010 audit failed, and the submit flow must require an explicit reviewer confirmation to continue without a successful audit result.
- Why: Fully blocking submission on workflow failure would create operational dead-ends for reviewers. Silent fail-open would undermine trust and hide the loss of validation. An explicit reviewer-confirmed override preserves usability while keeping the failure visible and intentional.
- Alternatives Rejected: Silent fail-open submission; unconditional fail-closed blocking.
- Follow-up: Lock whether this override should be captured in backend submission metadata or notification/audit logs for later chair visibility and operational review.

### D-024
- Question: Should reviewer-confirmed submission after AI-010 failure be recorded for later visibility?
- Decision: Yes. If a reviewer submits after AI-010 enforcement fails, that override event must be recorded in backend metadata or audit logs for later chair and operational visibility.
- Why: This is a material workflow event in an academic review process. Without a durable record, the system loses accountability and downstream users cannot distinguish a cleanly audited submission from one that bypassed validation due to workflow failure.
- Alternatives Rejected: No record of the override; frontend-only transient notice with no backend trace.
- Follow-up: The later implementation spec should define the exact storage shape and whether chairs see this directly in the review workspace or only through operational tooling first.

### D-025
- Question: Should AI-010 audit only the last persisted draft, or the current unsaved review payload the reviewer is actively editing?
- Decision: AI-010 must audit the current review payload supplied by the frontend or submit request, not only the last persisted draft.
- Why: Draft-save and submit-preflight behavior must reflect the exact review content the reviewer is about to save or submit. Auditing only the last persisted draft would produce stale and misleading findings.
- Alternatives Rejected: Auditing only the stored draft; requiring a save before every audit.
- Follow-up: The implementation spec should define the audit endpoint request body so it carries the current review payload explicitly.

### D-026
- Question: How should persisted dismissed warnings be represented back to the browser on later audit responses?
- Decision: Keep the `ai-service` finding contract pure, and have the Go browser-facing response separate `active_findings` from `dismissed_findings` after merging workflow findings with backend dismissal metadata.
- Why: Persisted dismissals need visibility and potential undo in the reviewer UI, but dismissal state is a backend concern rather than part of the workflow engine's raw finding output.
- Alternatives Rejected: Hiding dismissed warnings completely on later loads; embedding dismissal state directly into the `ai-service` workflow contract.
- Follow-up: The implementation spec should define the exact browser-facing response shape and dismissal update endpoint.
