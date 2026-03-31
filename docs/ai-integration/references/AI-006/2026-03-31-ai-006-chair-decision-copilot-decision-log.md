# AI-006 Chair Decision Copilot Decision Log

- Date: 2026-03-31
- Topic: ai-006-chair-decision-copilot
- Owner: Codex with user review

## Decisions

### D-001
- Question: When should the chair copilot generate its advisory package?
- Decision: Generation is explicit and chair-triggered. The chair must click `Generate recommendation`; nothing is precomputed on page load.
- Why: This reduces automation bias, avoids implying system authority, and keeps generation aligned with explicit chair intent.
- Alternatives Rejected: Automatic generation on page load; background precomputation without a user action.
- Follow-up: Design the `idle`, `generating`, `ready`, `failed`, and `stale` states around an explicit generate action.

### D-002
- Question: Should the copilot produce any visible directional stance such as `leans accept` or `leans reject`?
- Decision: No. The output stays strictly evidence-only with no directional lean.
- Why: A visible stance would collapse the product boundary from synthesis into recommendation and would materially increase automation bias in a chair-only decision surface.
- Alternatives Rejected: `leans accept`; `leans reject`; `mixed/inconclusive`; any score-like or verdict-like framing.
- Follow-up: Keep all generated sections descriptive and evidence-centered, and explicitly prohibit accept/reject language in the prompt and rendering contract.

### D-003
- Question: Should generated evidence packages persist for reuse, or be regenerated from scratch every time?
- Decision: Persist each generated evidence package and reuse it until the underlying evidence changes.
- Why: Chairs benefit from stable, inspectable output across revisits, and persistence avoids repeated generation work when the evidence bundle is unchanged.
- Alternatives Rejected: Fully transient output regenerated on every click; no caching or reuse layer.
- Follow-up: Define the evidence fingerprint, stale conditions, and access boundary for persisted packages.

### D-004
- Question: Should persisted evidence packages be private to the chair who generated them, or shared across chairs for the same submission?
- Decision: Persisted evidence packages are shared across chairs and tied to the submission, not to an individual chair.
- Why: The copilot output is generated from common submission evidence, so per-chair copies would create artificial divergence around a shared factual artifact.
- Alternatives Rejected: Private per-chair packages; separate caches keyed by chair identity.
- Follow-up: Define a submission-scoped fingerprint and access rules that allow any authorized chair for the conference to read the same current package.

### D-005
- Question: Should chairs be able to refresh a persisted package manually even if the evidence fingerprint has not changed?
- Decision: Yes. The UI should expose a manual `Regenerate` action in addition to automatic stale invalidation.
- Why: Chairs need an explicit retry and refresh control for trust, recovery, and prompt or model improvements, even when the underlying evidence is unchanged.
- Alternatives Rejected: Fingerprint-only regeneration with no manual override.
- Follow-up: Separate manual regeneration from any chair-authored steering input so the shared evidence package remains submission-scoped and evidence-derived.

### D-006
- Question: Should AI-006 accept chair-authored steering input or personal opinion to shape the generated output?
- Decision: No. AI-006 remains a pure summarization workflow and does not accept personalized steering input.
- Why: Personal input would drift the feature away from shared evidence synthesis, weaken the submission-scoped artifact boundary, and overlap with the existing platform chatbot.
- Alternatives Rejected: Freeform chair steering input; chair-specific opinion prompts; personalized regeneration prompts.
- Follow-up: Keep the shared package fully evidence-derived and position the platform chatbot as the separate surface for personalized exploration.

### D-007
- Question: Which extra computed analytics should be included in AI-006 v1?
- Decision: Include review distribution, confidence mix, weakest and strongest review criteria, rebuttal responsiveness, score changes after rebuttal, discussion activity with last evidence update, and review coverage completeness.
- Why: These signals are either already present in the current review analytics contract or can be derived cheaply from the evidence already loaded in the chair detail workflow.
- Alternatives Rejected: Score-only summary; no computed analytics; acceptance-likelihood style analytics.
- Follow-up: Keep rebuttal-related analytics conditional so they disappear cleanly when rebuttal is not enabled or no rebuttal evidence exists.

### D-008
- Question: How should rebuttal-related analytics behave when rebuttal is optional or absent?
- Decision: Rebuttal-related analytics must be dynamic. They appear only when rebuttal is enabled and relevant rebuttal evidence exists; otherwise they resolve to not-applicable rather than zero.
- Why: Treating missing rebuttal as a negative signal would distort the evidence package and would conflate conference policy with submission quality.
- Alternatives Rejected: Always showing rebuttal metrics; showing zeros when rebuttal is disabled; forcing rebuttal into the evidence fingerprint for every conference.
- Follow-up: Define exact rebuttal-presence and rebuttal-staleness rules in the storage and fingerprint sections.

### D-009
- Question: Should AI-006 synthesize only numeric review analytics, or also include reviewer narrative feedback?
- Decision: Include reviewer narrative feedback as a first-class evidence input, specifically the review feedback fields `summary`, `strengths`, `weaknesses`, and `questions`.
- Why: Chair decisions depend heavily on the substance of reviewer reasoning, not just recommendation counts and criterion averages.
- Alternatives Rejected: Numeric-only synthesis; metrics-first summary with no reviewer narrative integration.
- Follow-up: Treat `questions` as optional because the current reviewer submit validation requires `summary`, `strengths`, and `weaknesses`, but not `questions`.

### D-010
- Question: Should AI-006 use a dedicated backend workflow route, or should the chair page assemble data client-side and call generation more directly?
- Decision: Use a dedicated backend workflow route for lookup, generate, and regenerate operations.
- Why: The backend should own permission checks, evidence aggregation, fingerprinting, persistence, and workflow execution rather than spreading those concerns into the frontend page.
- Alternatives Rejected: Client-assembled generation flow; direct frontend-to-AI-service orchestration.
- Follow-up: Define the browser-facing route shape, internal workflow contract, and artifact persistence model.

### D-011
- Question: When a chair regenerates AI-006, should the system overwrite only the current artifact, or keep lightweight per-run history internally?
- Decision: Keep lightweight per-run history internally and point the submission to the latest artifact.
- Why: This preserves auditability and debugging value without turning the chair UI into a version browser.
- Alternatives Rejected: Overwrite-only storage with no retained run history; fully exposed version history in the chair UI.
- Follow-up: Define the minimum run metadata, retention expectations, and how the current artifact references the latest successful run.

### D-012
- Question: What exact changes should invalidate the persisted evidence package fingerprint?
- Decision: Invalidate only on decision-relevant evidence changes: review created, updated, or submitted; rebuttal point or reviewer acknowledgment changed when rebuttal applies; discussion thread or message added; submission metadata visible to the chair changed; and status or history changes that alter decision context.
- Why: Broad invalidation on every history mutation would make the shared artifact unstable and noisy, while this narrower rule tracks the evidence that can materially change a chair's understanding of the case.
- Alternatives Rejected: Invalidate on every history event; manual regeneration only; ignore discussion or rebuttal changes.
- Follow-up: Define the concrete fingerprint fields and normalize how `not applicable` rebuttal state is represented.

### D-013
- Question: Where should AI-006 live in the chair submission workspace?
- Decision: Keep AI-006 in the existing `reviews` tab as a clearly separate copilot panel above the final accept or reject controls. Do not add a new top-level tab and do not embed it inside the decision form itself.
- Why: This keeps the feature close to the decision workflow while preserving a visible boundary between advisory synthesis and the actual decision action.
- Alternatives Rejected: New dedicated top-level tab; embedding the copilot inside the accept or reject form; placing it far away from the review and decision surface.
- Follow-up: Define the exact panel states, empty state, and relationship to the existing review and rebuttal content stack.

### D-014
- Question: What should the persisted AI-006 artifact schema contain?
- Decision: The artifact includes `evidence_summary`, `review_feedback_synthesis`, `review_analytics`, `discussion_signals`, `rebuttal_signals`, `disagreement_map`, `suggested_chair_note`, `guardrails`, `evidence_fingerprint`, and `generated_at`.
- Why: This shape keeps the package interpretable, evidence-first, and compatible with the accepted UI sections while preserving the metadata needed for persistence and invalidation.
- Alternatives Rejected: Freeform markdown blob; analytics-only payload; schema with verdict-like or score-like output fields.
- Follow-up: Keep `rebuttal_signals` nullable or `not_applicable`, and explicitly prohibit any accept, reject, lean, or probability fields in the schema and prompt.

### D-015
- Question: Which overall solution shape should AI-006 use?
- Decision: Use the submission-scoped persisted workflow in the existing `reviews` tab, backed by a dedicated backend route, shared current artifact, and lightweight internal run history.
- Why: It is the only option that matches the accepted product boundary for shared evidence synthesis, persistence, multi-chair reuse, and low-authority UI placement without inventing extra workflow surface.
- Alternatives Rejected: Ephemeral on-demand generation with no persisted artifact; separate AI-006 workspace or top-level tab.
- Follow-up: Finalize the browser-facing route contract and the artifact plus run models under this shape.

### D-016
- Question: What should the browser-facing API contract look like?
- Decision: Expose a dedicated backend workflow route with `GET /decision-copilot` for lookup, `POST /decision-copilot/generate` for explicit initial generation, and `POST /decision-copilot/regenerate` for explicit manual reruns.
- Why: This keeps UI intent explicit and lets the backend own auth, evidence aggregation, fingerprinting, persistence, and AI workflow execution.
- Alternatives Rejected: Single generic action endpoint; implicit generation on `GET`; client-assembled AI calls.
- Follow-up: Define the concrete current-artifact and run-record models behind these endpoints.

### D-017
- Question: What persistence model should back AI-006 artifacts and run history?
- Decision: Use two persistence models: a current `decision_copilot_artifact` record per submission for UI reads, plus append-only lightweight `decision_copilot_run` records for generate and regenerate attempts.
- Why: This preserves a simple current-state lookup for the UI while keeping enough internal history for audit, debugging, and cache reasoning.
- Alternatives Rejected: Run-only storage with no current artifact record; overwrite-only current artifact with no run history.
- Follow-up: Define the exact artifact payload, run metadata, and evidence-bundle fingerprint fields.

### D-018
- Question: What exact evidence bundle and fingerprint inputs should drive AI-006 generation and staleness?
- Decision: Build a normalized evidence bundle from submission context, review payloads and statuses, derived review analytics, discussion signals, conditional rebuttal signals, and decision-relevant history markers. Fingerprinting hashes normalized decision-relevant inputs plus a prompt or schema version string.
- Why: This makes staleness deterministic, keeps the artifact grounded in the actual chair-visible evidence, and avoids broad invalidation from unrelated history noise.
- Alternatives Rejected: Fingerprinting all history events; hashing generated analytics instead of source evidence; discussion-only timestamps with no normalized review payloads.
- Follow-up: Define lifecycle and failure behavior around this fingerprint, including how `stale`, `failed`, and reuse states surface in the UI.

### D-019
- Question: What lifecycle and failure behavior should AI-006 use?
- Decision: Use explicit `idle`, `generating`, `ready`, `stale`, and `failed` states. Never silently regenerate on page load. When a prior artifact exists, keep showing it during reruns and failed refresh attempts.
- Why: This preserves chair control, avoids silent automation, and keeps evidence continuity when refreshes fail or new runs are in flight.
- Alternatives Rejected: Silent regeneration on page load; blanking the panel during reruns; deleting the last successful artifact after a failed rerun.
- Follow-up: Define test and observability requirements for these states and transitions.

### D-020
- Question: What testing and observability requirements should AI-006 have?
- Decision: Verify explicit state rendering, no implicit generation on `GET` or page load, strict advisory-only behavior, rebuttal-conditional handling, and preservation of the last successful artifact after failed reruns. Add lightweight run-level observability for trigger type, artifact reuse vs rerun, stale reasons, rebuttal applicability, outcome, and duration.
- Why: This feature’s main risks are authority drift, silent automation, and stale-or-fragile caching, so verification and runtime visibility must focus on those boundaries rather than generic UI polish.
- Alternatives Rejected: Minimal happy-path-only tests; verbose content logging of sensitive review or discussion text; no stale-reason observability.
- Follow-up: Run a final design-readiness pass and resolve any remaining contract ambiguities before PRD and implementation-spec writing.

### D-021
- Question: How long should AI-006 run history be retained, and should it be visible in the chair UI?
- Decision: Keep all run records for the lifetime of the submission, expose no run-history UI, and treat run history as internal-only for audit and debugging.
- Why: Regeneration volume should stay low, and retention is more valuable than premature cleanup for troubleshooting or audit needs.
- Alternatives Rejected: Short capped retention; run-history UI in the chair surface; deletion of older successful runs.
- Follow-up: Reflect this retention rule in the implementation spec and persistence design.
