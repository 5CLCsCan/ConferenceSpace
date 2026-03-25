# AI Integration Map — ConferenceSpace

> Source: Platform Reconnaissance — [platform-recon.md](./platform-recon.md)
> Revision basis: Product-owner review feedback (workflow vs core-agent skill split).
>
> Canonical per-integration lifecycle records now live under [`docs/ai-integration/`](./ai-integration/).
> Use [`docs/ai-integration/procedure.md`](./ai-integration/procedure.md) for folder rules and lifecycle handling.
> Use the relevant `AI-xxx` document in that folder for current implementation state and evidence-backed verdicts.

---

## Workflow vs Skill Boundary

- **Workflow integration**: Requires product/engineering work beyond prompt tuning. Typical signals: new backend pipeline, persisted AI artifacts, event triggers, gating/automation logic, new UI states, or compliance enforcement.
- **Core-agent skill**: On-demand capability invoked in chat using existing data/tools. Typical signals: retrieval + synthesis, drafting assistance, recommendations, and guided navigation without introducing a dedicated system workflow.
- **Dismissed item**: Not pursued now due redundancy, weak value, or unclear scope.

This revision applies your requested boundary consistently.

---

## Final Integration Scope

### A. Workflow Integrations (Engineering Work Required)

### AI-001: Conference Agent (Cross-role Conversational Operator)

| Field           | Value                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Mode            | Workflow                                                                                        |
| Category        | agentic                                                                                         |
| Impact          | High                                                                                            |
| Feasibility     | Medium                                                                                          |
| Role(s)         | Author, Reviewer, Chair                                                                         |
| Trigger         | User chat request; optionally event-driven nudges after key state changes.                      |
| Input           | Role context, route/page context, conference/submission/review/discussion/notification data.    |
| Output          | Role-aware answers, guided navigation, and safe action execution through controlled tool calls. |
| Risk/Concern    | Permission leakage, unsafe action execution, hallucinated action outcomes.                      |
| Dependency      | Server-side tool layer for authenticated actions + approval gates + audit logs.                 |
| Recon reference | Section 2, Section 3, Section 4, Section 6                                                      |

**Canonical Detail Record:** [`docs/ai-integration/AI-001-conference-agent.md`](./ai-integration/AI-001-conference-agent.md)
**Current Documentation Status:** AI-001 has a shipped implementation in the codebase, but the lifecycle record is the source of truth for the exact verdict, delivered scope, and remaining gaps.

**Description:**
This remains the core AI integration and control plane across roles. It is the correct place for conversational orchestration, while other "skill-like" features can be loaded into it instead of becoming standalone workflows.

**Implementation Notes:**
Shipped v1 now spans the global frontend chatbot shell, Next.js chat/session proxy routes, and the dedicated `ai-service` runtime. The current tool surface remains DOM-oriented (`getPageContext`, `performAction`), while the detailed AI-001 lifecycle record documents what is shipped versus what still needs server-backed role-aware tools and approval-gated actions.

---

### AI-002: Submission Material Gating (Pre-ingestion Compliance & Integrity)

| Field           | Value                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| Mode            | Workflow                                                                    |
| Category        | monitoring                                                                  |
| Impact          | High                                                                        |
| Feasibility     | Medium                                                                      |
| Role(s)         | Chair, Author                                                               |
| Trigger         | Upload/publish events before review intake.                                 |
| Input           | Submission files, extracted content, conference policies, precheck signals. |
| Output          | Pass/warn/block result + remediation guidance.                              |
| Risk/Concern    | False positives and deadline friction.                                      |
| Dependency      | Policy persistence and enforcement hooks (chair-configurable criteria).     |
| Recon reference | Section 3 (Author), Section 4 (Submission), Section 5a/5b                   |

**Description:**
This is still a high-priority workflow because it affects pipeline quality and reviewer load at ingestion time. Unlike chat-only skills, it requires deterministic, enforceable behavior.

**Implementation Notes:**
Existing precheck API and UI are already integrated: `frontend/lib/api/papers.ts` (`precheckPaper`) and `frontend/components/author/submit/file-upload-step.tsx`. Needed step is moving from advisory precheck to formal gating policy.

**Canonical Detail Record:** [`docs/ai-integration/AI-002-submission-material-gating.md`](./ai-integration/AI-002-submission-material-gating.md)
**Current Documentation Status:** AI-002 currently has an advisory precursor in the frontend and Go backend, but the lifecycle record is the source of truth for the implementation-ready design baseline, current `needs work` verdict, and remaining gap to a deterministic `ai-service` workflow.

---

### AI-003: Reviewer Pre-Read Submission Analysis Briefing

| Field           | Value                                                                           |
| --------------- | ------------------------------------------------------------------------------- |
| Mode            | Workflow                                                                        |
| Category        | text-analysis                                                                   |
| Impact          | High                                                                            |
| Feasibility     | Medium                                                                          |
| Role(s)         | Reviewer (primary), Chair (secondary)                                           |
| Trigger         | Reviewer opens assignment/review context.                                       |
| Input           | Submission + metadata + optional precheck outputs + discussion summary.         |
| Output          | Structured reviewer briefing (summary, contributions, weaknesses, focus areas). |
| Risk/Concern    | Reviewer anchoring bias.                                                        |
| Dependency      | Async analysis generation + caching by submission/version.                      |
| Recon reference | Section 3 (Reviewer), Section 4 (Review Execution)                              |

**Description:**
This remains a valid workflow because it is pre-computed, structured, and reused in the review process. It is more than ad hoc chat assistance.

**Implementation Notes:**
Reviewer page already has a placeholder AI panel in `frontend/components/reviewer/submission-review/review-sidebar.tsx`, with mock output and TODO markers. Assignment context and review contracts already exist.

---

### AI-006: Chair Decision Copilot (Evidence Synthesis + Rationale)

| Field           | Value                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Mode            | Workflow                                                                                                                     |
| Category        | decision-support                                                                                                             |
| Impact          | High                                                                                                                         |
| Feasibility     | High                                                                                                                         |
| Role(s)         | Chair                                                                                                                        |
| Trigger         | Chair opens submission decision context.                                                                                     |
| Input           | Reviews, analytics, discussion history, submission timeline.                                                                 |
| Output          | Non-binding recommendation package (evidence summary, disagreement map, suggested note); final decision remains chair-owned. |
| Risk/Concern    | Automation bias in acceptance decisions; users may over-trust AI phrasing if authority boundaries are unclear.               |
| Dependency      | Hard guardrail: no automatic decision commit and no autonomous status mutation.                                              |
| Recon reference | Section 3 (Chair), Section 4 (Decision Workflow)                                                                             |

**Description:**
This remains one of the strongest workflow candidates: high impact and already data-complete in the chair detail flow. It is strictly advisory-only and must never replace chair judgment. Chairs remain the sole authority to accept/reject.

**Implementation Notes:**
Chair detail loader already aggregates reviews, analytics, discussion, and history in `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx`. Persisted decision states are currently accept/reject in `frontend/components/chair/submission-review-tab.tsx`; the copilot must never call `updateSubmissionStatus` automatically and should only support explicit chair-triggered decision actions.

---

### AI-007: Discussion Intelligence (Summaries, Open Questions, Consensus Drift)

| Field           | Value                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| Mode            | Workflow                                                               |
| Category        | text-analysis                                                          |
| Impact          | Medium                                                                 |
| Feasibility     | High                                                                   |
| Role(s)         | Author, Reviewer, Chair                                                |
| Trigger         | Thread open, new message, or pre-decision review.                      |
| Input           | Discussion threads/messages with role visibility context.              |
| Output          | Thread summaries, unresolved items, and conflict/consensus indicators. |
| Risk/Concern    | Mis-summarization and visibility boundary leakage.                     |
| Dependency      | None for summarization-first rollout.                                  |
| Recon reference | Section 3 (Shared Collaboration), Section 4 (Discussion)               |

**Description:**
Kept as workflow because it is recurring, can be persisted, and directly supports decision quality. This is distinct from ad hoc chat summarization because it benefits from consistent per-thread state.

**Implementation Notes:**
Persisted discussion contracts exist in `frontend/lib/api/discussions.ts` with role wrappers in author/reviewer/chair discussion tabs.

---

### AI-010: Review Quality and Consistency Auditor

| Field           | Value                                                               |
| --------------- | ------------------------------------------------------------------- |
| Mode            | Workflow                                                            |
| Category        | monitoring                                                          |
| Impact          | High                                                                |
| Feasibility     | Medium                                                              |
| Role(s)         | Reviewer, Chair                                                     |
| Trigger         | Review draft save and submit attempt.                               |
| Input           | Scores, recommendation, confidence, and narrative review text.      |
| Output          | Inconsistency/missing-justification alerts before final submission. |
| Risk/Concern    | Over-standardized review style.                                     |
| Dependency      | Optional rubric policy controls from 5b for strict enforcement.     |
| Recon reference | Section 4 (Review Execution), Section 5b (Review Policy)            |

**Description:**
Retained as workflow because it is a quality gate in a high-value core process. It should be deterministic and integrated into submit-time validation.

**Implementation Notes:**
Review persistence and submit path already exist in `frontend/components/reviewer/submission-review.tsx`, `frontend/hooks/use-assignment-review.ts`, and `frontend/lib/api/reviews.ts`.

---

### AI-014: Semantic Search Across Submissions, Reviews, and Discussions

| Field           | Value                                                             |
| --------------- | ----------------------------------------------------------------- |
| Mode            | Workflow                                                          |
| Category        | search                                                            |
| Impact          | Medium                                                            |
| Feasibility     | Medium                                                            |
| Role(s)         | Chair, Reviewer, Author                                           |
| Trigger         | Search queries in role workspaces or decision prep.               |
| Input           | Submission text/metadata, reviews, discussion content, role ACLs. |
| Output          | Intent-aware ranked results and related-context snippets.         |
| Risk/Concern    | ACL leakage risk if retrieval guardrails are weak.                |
| Dependency      | Indexed retrieval backend + strict role-aware filtering.          |
| Recon reference | Section 3, Section 4, Section 6                                   |

**Description:**
Kept as workflow because meaningful semantic retrieval requires indexing, ACL-aware serving, and reusable infra not achievable by prompt-only changes.

**Implementation Notes:**
No semantic index exists yet; this is new infrastructure on top of existing API data sources (`submissions`, `reviews`, `discussions`, `notifications`).

---

### B. Core-Agent Skills (Prompt + Tool Configuration, No Dedicated Workflow)

### AI-008: Notification Prioritization and Next-Best-Action Routing

| Field           | Value                                                          |
| --------------- | -------------------------------------------------------------- |
| Mode            | Core-agent skill                                               |
| Category        | personalization                                                |
| Impact          | Medium                                                         |
| Feasibility     | High                                                           |
| Role(s)         | Author, Reviewer, Chair                                        |
| Trigger         | User asks agent: "What should I do next?"                      |
| Input           | Notification feed/unread state + role + deep links.            |
| Output          | Chat response with ranked tasks and direct links.              |
| Risk/Concern    | Over-prioritization errors if context window is stale.         |
| Dependency      | Agent read tool for notifications + role-aware route resolver. |
| Recon reference | Section 6 (Communication), Section 4 (Notification Flow)       |

**Description:**
Converted to skill per your request. No dedicated inbox-ranking workflow is needed; the core agent can retrieve and synthesize in real time.

**Implementation Notes:**
Leverages existing notification stack in `frontend/lib/api/notifications.ts`, `frontend/hooks/use-notifications.ts`, and route translation in `frontend/lib/notifications/resolve-action-url.ts`.

---

### AI-009: Author Submission Drafting Assistant (Assistive, Non-autofill)

| Field           | Value                                                                           |
| --------------- | ------------------------------------------------------------------------------- |
| Mode            | Core-agent skill                                                                |
| Category        | generative                                                                      |
| Impact          | Medium                                                                          |
| Feasibility     | High                                                                            |
| Role(s)         | Author                                                                          |
| Trigger         | Author explicitly requests drafting help in chat.                               |
| Input           | User-provided content + conference context.                                     |
| Output          | Suggested text variants only; never auto-insert or auto-submit.                 |
| Risk/Concern    | Academic integrity concerns if positioned as ghostwriting.                      |
| Dependency      | Prompt guardrails enforcing "human final authorship" and "no auto-fill" policy. |
| Recon reference | Section 3 (Author Workspace), Section 4 (Submission Lifecycle)                  |

**Description:**
Converted to skill with strict ethics boundary: conversational assistance only, no autonomous form population. This aligns with your requirement to avoid automatic academic content generation in workflow automation.

**Implementation Notes:**
Agent should only return draft suggestions in chat and require manual user editing in `frontend/components/author/submit/paper-submission-form.tsx`.

---

### AI-011: Reviewer Workload / Deadline-Risk / SLA Insights

| Field           | Value                                                                   |
| --------------- | ----------------------------------------------------------------------- |
| Mode            | Core-agent skill                                                        |
| Category        | decision-support                                                        |
| Impact          | Medium                                                                  |
| Feasibility     | Medium                                                                  |
| Role(s)         | Reviewer, Chair                                                         |
| Trigger         | User asks workload risk questions in chat.                              |
| Input           | Dashboard assignments, invitations, due dates, completion history.      |
| Output          | Chat-based risk summary and suggested mitigations.                      |
| Risk/Concern    | Over-interpretation of sparse data.                                     |
| Dependency      | Read tools over reviewer dashboard/assignment endpoints.                |
| Recon reference | Section 3 (Reviewer Workspace), Section 4 (Invitation/Review workflows) |

**Description:**
Converted to skill due scope vagueness as a hard workflow. It remains useful as a queryable analytical capability inside the core agent.

**Implementation Notes:**
Data is available from reviewer APIs in `frontend/lib/api/reviewer.ts` and `frontend/lib/api/reviews.ts`; no standalone workflow UI required.

---

### AI-012: Chair Natural-Language Conference Configuration Guidance

| Field           | Value                                                                         |
| --------------- | ----------------------------------------------------------------------------- |
| Mode            | Core-agent skill                                                              |
| Category        | agentic                                                                       |
| Impact          | Medium                                                                        |
| Feasibility     | Medium                                                                        |
| Role(s)         | Chair                                                                         |
| Trigger         | Chair asks agent to propose settings/config changes.                          |
| Input           | Existing conference config + chair intent prompt.                             |
| Output          | Suggested setting changes and rationale in chat; user confirms manually.      |
| Risk/Concern    | Misinterpretation of policy intent.                                           |
| Dependency      | Agent read/write tooling can be phased; start with recommendation-only skill. |
| Recon reference | Section 4 (Conference Setup), Section 5a/5b                                   |

**Description:**
Converted to skill as requested. Instead of building a separate configuration workflow, the core agent should guide and optionally navigate users through existing setup pages.

**Implementation Notes:**
Existing config mapping is explicit in `frontend/app/role/chair/conferences/new/page.tsx` and `frontend/lib/api/conferences.ts`.

---

### AI-013: CFP Drafting/Rewriting/Localization

| Field           | Value                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| Mode            | Core-agent skill                                                          |
| Category        | generative                                                                |
| Impact          | Medium                                                                    |
| Feasibility     | Medium                                                                    |
| Role(s)         | Chair                                                                     |
| Trigger         | Chair asks for CFP rewrite/localization help.                             |
| Input           | Existing CFP text + conference metadata/dates/policies.                   |
| Output          | Candidate text variants in chat; manual human approval required.          |
| Risk/Concern    | Policy/date drift if suggestions are accepted without verification.       |
| Dependency      | Prompt constraints to force date/policy consistency checks before output. |
| Recon reference | Section 3 (Chair Workspace), Section 5a (CFP config)                      |

**Description:**
Converted to skill, not a dedicated workflow. The agent should support iterative drafting in conversation and avoid auto-publishing behavior.

**Implementation Notes:**
Use existing CFP data surfaces from conference APIs and chair pages; keep human-in-the-loop publishing.

---

### AI-016: Rebuttal Refinement Assistant

| Field           | Value                                                                   |
| --------------- | ----------------------------------------------------------------------- |
| Mode            | Core-agent skill                                                        |
| Category        | generative                                                              |
| Impact          | Medium                                                                  |
| Feasibility     | Low                                                                     |
| Role(s)         | Author, Reviewer, Chair                                                 |
| Trigger         | User asks for rebuttal refinement in chat.                              |
| Input           | User-provided draft and visible review/discussion context.              |
| Output          | Refined language/options in chat only.                                  |
| Risk/Concern    | Could encourage over-optimized persuasive style.                        |
| Dependency      | Rebuttal write path is backend-blocked, so skill remains advisory-only. |
| Recon reference | Section 4 (Rebuttal Surface), Section 5b (Rebuttal Policy)              |

**Description:**
Converted to skill exactly as requested. It provides conversational help without introducing a dedicated rebuttal workflow.

**Implementation Notes:**
Current rebuttal tabs are read-only with explicit backend blockers in `frontend/components/author/submission-detail/rebuttal-tab.tsx` and `frontend/components/reviewer/submission-review/rebuttal-tab.tsx`.

---

### AI-018: Schedule Planning Assistant

| Field           | Value                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| Mode            | Core-agent skill                                                            |
| Category        | decision-support                                                            |
| Impact          | Medium                                                                      |
| Feasibility     | Low                                                                         |
| Role(s)         | Chair                                                                       |
| Trigger         | Chair asks planning/schedule what-if questions in chat.                     |
| Input           | Available schedule/timeline data + constraints provided by chair in prompt. |
| Output          | Suggested scenarios and trade-offs in chat.                                 |
| Risk/Concern    | Low trust due synthetic/mock schedule data.                                 |
| Dependency      | Real schedule backend to move beyond advisory skill.                        |
| Recon reference | Section 3 (Chair Schedules), Section 5a/5b (Scheduling)                     |

**Description:**
Converted to skill, not workflow. This should remain advisory until scheduling data is authoritative.

**Implementation Notes:**
Current schedules page uses mock data models in `frontend/app/role/chair/schedules/page.tsx`.

---

### AI-019: Role-Personalized Daily Briefing

| Field           | Value                                                            |
| --------------- | ---------------------------------------------------------------- |
| Mode            | Core-agent skill                                                 |
| Category        | personalization                                                  |
| Impact          | Medium                                                           |
| Feasibility     | Medium                                                           |
| Role(s)         | Author, Reviewer, Chair                                          |
| Trigger         | User asks for "today briefing" in chat.                          |
| Input           | Role context + pending tasks + unread notifications + due dates. |
| Output          | Chat-based prioritized daily briefing.                           |
| Risk/Concern    | Omission risk if source retrieval is incomplete.                 |
| Dependency      | Agent retrieval tools over role dashboards and notifications.    |
| Recon reference | Section 2 (Multi-role), Section 6 (Communication Model)          |

**Description:**
Converted to skill as requested. No dedicated briefing page/workflow is required.

**Implementation Notes:**
Leverage existing role/session context and notification endpoints for retrieval; output remains conversational.

---

## Revised Priority Matrix

| ID     | Title                                     | Mode     | Decision       | Impact | Feasibility |
| ------ | ----------------------------------------- | -------- | -------------- | ------ | ----------- |
| AI-001 | Conference Agent                          | Workflow | Build          | High   | Medium      |
| AI-002 | Submission Material Gating                | Workflow | Build          | High   | Medium      |
| AI-003 | Reviewer Pre-Read Briefing                | Workflow | Build          | High   | Medium      |
| AI-006 | Chair Decision Copilot                    | Workflow | Build          | High   | High        |
| AI-007 | Discussion Intelligence                   | Workflow | Build          | Medium | High        |
| AI-010 | Review Quality Auditor                    | Workflow | Build          | High   | Medium      |
| AI-014 | Semantic Search                           | Workflow | Build          | Medium | Medium      |
| AI-008 | Notification Prioritization               | Skill    | Build as skill | Medium | High        |
| AI-009 | Author Drafting Assistance (non-autofill) | Skill    | Build as skill | Medium | High        |
| AI-011 | Workload/SLA Insight                      | Skill    | Build as skill | Medium | Medium      |
| AI-012 | NL Configuration Guidance                 | Skill    | Build as skill | Medium | Medium      |
| AI-013 | CFP Draft/Rewriting                       | Skill    | Build as skill | Medium | Medium      |
| AI-016 | Rebuttal Refinement                       | Skill    | Build as skill | Medium | Low         |
| AI-018 | Schedule Planning Assistant               | Skill    | Build as skill | Medium | Low         |
| AI-019 | Daily Briefing                            | Skill    | Build as skill | Medium | Medium      |

---

## Coverage Audit (Post-Revision)

| Recon Section                 | Coverage After Revision                                         | Notes                                                                                        |
| ----------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1. Platform Summary           | AI-001, AI-019(skill)                                           | Cross-role lifecycle covered by core agent + optional briefing skill.                        |
| 2. User Roles                 | AI-001, AI-006                                                  | Admin remains non-target due no routed admin workspace.                                      |
| 3. Feature Map                | AI-001, AI-002, AI-003, AI-006, AI-007, AI-010, AI-014 + skills | Assignment flow remains implemented without extra AI layer; other core areas remain covered. |
| 4. Core Workflows             | AI-002, AI-003, AI-006, AI-007, AI-010                          | Rebuttal/camera-ready/scheduling are now advisory skill or dismissed per review.             |
| 5a. Implemented Configuration | AI-002, AI-006, AI-012(skill), AI-013(skill)                    | Immediate config-backed workflows retained.                                                  |
| 5b. Implied Configuration     | AI-010, AI-012(skill), AI-018(skill)                            | Long-horizon policy needs remain dependency-gated.                                           |
| 6. Communication Model        | AI-001, AI-008(skill), AI-019(skill)                            | In-app + websocket model leveraged through core agent retrieval.                             |

---

## Recommended Starting Points (Revised)

1. **AI-001 (Workflow) + Skill Pack foundation**  
   Implement secure role-aware tooling for the core agent first. This unlocks multiple requested skill-mode items without building redundant standalone workflows.

2. **AI-002 (Workflow): Submission Material Gating**  
   High-impact and already partially wired via precheck contracts. This is the strongest immediate pipeline-quality improvement.

3. **AI-003 (Workflow): Reviewer Pre-Read Briefing**  
   Reviewer UI already has a placeholder AI panel, so replacing mock behavior with a real analysis pipeline is a practical next step.

4. **AI-006 (Workflow): Chair Decision Copilot**  
   High value and high feasibility due existing aggregated evidence surfaces in chair detail pages.

5. **Skill rollout set (AI-008, AI-009, AI-012, AI-019)**  
   Enable these as explicit core-agent skills with strict guardrails (especially non-autofill and human-authorship constraints for AI-009).
