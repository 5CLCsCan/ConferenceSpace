
# AI Integration Map — ConferenceSpace

> Source: Platform Reconnaissance — [platform-recon.md](./platform-recon.md)

---

## Integration Points

<!-- Ordered by Impact (High first), then Feasibility (High first), with AI-001..AI-003 fixed first. -->

### AI-001: Conference Agent (Cross-role Conversational Operator)

| Field | Value |
| --------------- | ---------------------------------- |
| Category | agentic |
| Impact | High |
| Feasibility | Medium |
| Role(s) | Author, Reviewer, Chair |
| Trigger | User prompt in chatbot; optional proactive trigger on workflow events (new assignment, pending decision, deadline risk). |
| Input | Current route + page context, role context, conference/submission/review/discussion/notification data from existing APIs. |
| Output | Conversational answers, guided navigation, action suggestions, and optionally executed safe actions with audit trail. |
| Risk/Concern | Over-automation, permission leakage across roles, hallucinated state/action mismatch, unsafe action execution. |
| Dependency | Role-scoped server tool layer for action APIs, approval/confirmation gates, action audit logging, policy guardrails. |
| Recon reference | Section 2: User Roles; Section 3: Identity/Auth and Shared Collaboration; Section 4: Core Workflows; Section 6: Communication Model |

**Description:**
This is a unified in-product assistant that helps users query platform state and complete multi-step tasks across author/reviewer/chair workflows. It can answer status questions, route users to the correct screens, and execute constrained actions where backend contracts exist. The integration has high leverage because it cuts across most operational workflows and role contexts.

**Implementation Notes:**
A baseline already exists: global chatbot mount in `frontend/app/layout.tsx`, transport and tool-call UI in `frontend/components/chatbot/chat-view.tsx`, and model endpoint in `frontend/app/api/chat/route.ts`. Current tools (`getPageContext`, `performAction`) are DOM/browser actions, not authoritative backend operations, so production-grade "act on behalf" requires adding server-side tool adapters to existing typed API wrappers (for example `frontend/lib/api/submissions.ts`, `frontend/lib/api/reviews.ts`, `frontend/lib/api/notifications.ts`) plus role-check and confirmation middleware.

---
### AI-002: Submission Material Gating (Pre-ingestion Compliance & Integrity Checks)

| Field | Value |
| --------------- | ---------------------------------- |
| Category | monitoring |
| Impact | High |
| Feasibility | Medium |
| Role(s) | Chair (policy owner), Author (feedback recipient) |
| Trigger | File upload, save draft, publish attempt, and pre-review ingestion checkpoint. |
| Input | Submission file(s), parsed manuscript text/structure, conference policy config, chair prompt-defined criteria, plagiarism/reference signals. |
| Output | Compliance report, pass/warn/block decision, and actionable remediation hints surfaced in submission flow. |
| Risk/Concern | False positives near deadlines, plagiarism service privacy/legal issues, opaque gating logic reducing author trust. |
| Dependency | Chair-configurable NL policy storage/execution (5b extension), plagiarism/reference services, backend enforcement hook before publish. |
| Recon reference | Section 3: Author Workspace; Section 4: Author Submission Lifecycle; Section 5a: Implemented Configuration; Section 5b: Submission Policy |

**Description:**
This integration enforces quality and policy checks before a submission enters the review pipeline. It upgrades current informational checks into deterministic gate states tied to conference policy. It directly protects reviewer time and improves submission quality consistency.

**Implementation Notes:**
There is already a concrete precheck contract in `frontend/lib/api/papers.ts` (`precheckPaper`) and active UI trigger/rendering in `frontend/components/author/submit/file-upload-step.tsx`. Today the precheck output is advisory; hard gating, plagiarism/reference validity checks, and chair-authored NL criteria need backend policy persistence and enforcement wiring in publish/save paths used by `submitPaper`/`updatePaper`.

---

### AI-003: Reviewer Pre-Read Submission Analysis Briefing

| Field | Value |
| --------------- | ---------------------------------- |
| Category | text-analysis |
| Impact | High |
| Feasibility | Medium |
| Role(s) | Reviewer (primary), Chair (secondary) |
| Trigger | Reviewer opens assignment or review tab before writing scores/feedback. |
| Input | Submission metadata, manuscript text, precheck results, conference context, and prior discussion snapshots. |
| Output | Structured briefing: plain-language summary, key contributions, methodology, likely weaknesses, related-work gaps, and reviewer focus areas. |
| Risk/Concern | Reviewer anchoring bias, over-reliance on generated critique, uneven quality across domains. |
| Dependency | Async analysis pipeline and result storage keyed by submission version; confidence and provenance display. |
| Recon reference | Section 3: Reviewer Workspace; Section 4: Review Execution Lifecycle; Section 5a: Implemented Configuration |

**Description:**
This capability gives reviewers a standardized pre-read packet before they start scoring, improving speed and consistency. It also helps chairs by reducing variance in reviewer preparedness. The feature is high-value where reviewer load is heavy and deadlines are tight.

**Implementation Notes:**
Reviewer UI already contains a placeholder AI panel (`frontend/components/reviewer/submission-review/review-sidebar.tsx`) with mock analysis behavior and TODO comments for real API integration. Assignment and submission context are already resolved through `frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx`, `frontend/hooks/use-assignment-review.ts`, and review APIs in `frontend/lib/api/reviews.ts`, enabling incremental rollout without redesigning the review screen.

---

### AI-006: Chair Decision Copilot (Evidence Synthesis + Decision Rationale)

| Field | Value |
| --------------- | ---------------------------------- |
| Category | decision-support |
| Impact | High |
| Feasibility | High |
| Role(s) | Chair |
| Trigger | Chair opens submission decision context or attempts to save final decision. |
| Input | Review analytics, reviewer comments, discussion threads/messages, submission history, and current status. |
| Output | Ranked decision recommendation with rationale, disagreement map, and confidence score; optional decision-note draft. |
| Risk/Concern | Automation bias in high-stakes acceptance decisions, explainability and fairness concerns. |
| Dependency | None for read-only assist; optional decision-note persistence for full auditability. |
| Recon reference | Section 3: Chair Workspace; Section 4: Chair Decision Workflow; Section 4: Discussion Lifecycle; Section 5a: Decision-state Control |

**Description:**
This integration synthesizes scattered decision evidence into a clear recommendation for chairs. It can reduce cognitive load and improve consistency when many submissions are pending. Because accept/reject persistence already exists, the copilot can be deployed as an assistive layer without waiting for new core workflow contracts.

**Implementation Notes:**
Chair detail page already aggregates all required inputs via `getSubmissionReviews`, `getSubmissionReviewAnalytics`, `getThreads`, and `getMessages` in `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx`. Final state persistence is implemented in `frontend/components/chair/submission-review-tab.tsx` through `updateSubmissionStatus` (accept/reject only), making recommendation-first rollout technically straightforward.

---
### AI-005: COI Risk Detection, Explanation, and Assignment Guardrails

| Field | Value |
| --------------- | ---------------------------------- |
| Category | monitoring |
| Impact | High |
| Feasibility | Medium |
| Role(s) | Chair |
| Trigger | COI dashboard inspection, assignment planning, and invitation handling windows. |
| Input | COI relationships, severity/type evidence, reviewer-author metadata, submission context, assignment plans. |
| Output | Conflict risk flags, explainable rationale per match, and safe assignment alternatives. |
| Risk/Concern | Sensitive relationship inference, false positives/negatives, potential reviewer reputation harm. |
| Dependency | Backend moderation mutation endpoints (confirm/dismiss/reassign) for closed-loop operationalization. |
| Recon reference | Section 3: Chair Workspace (COI); Section 4: Reviewer Invitation Lifecycle; Section 5a: COI Maintenance; Section 5b: COI Policy |

**Description:**
This integration raises assignment quality and fairness by making conflict signals actionable and explainable. It can proactively block risky reviewer-paper pairings before invitations finalize. The strongest immediate value is in recommendation/explanation mode using existing COI data.

**Implementation Notes:**
COI data contracts are API-backed in `frontend/lib/api/coi.ts`, and chair COI UI is operational in `frontend/components/chair/conference-detail/conference-coi.tsx` including rebuild trigger. The same UI explicitly notes moderation actions are disabled due missing backend write endpoints, so guardrail recommendations can ship first while mutation workflows remain dependency-gated.

---

### AI-004: Reviewer Assignment & Invitation Prioritization Copilot

| Field | Value |
| --------------- | ---------------------------------- |
| Category | decision-support |
| Impact | High |
| Feasibility | Medium |
| Role(s) | Chair (primary), Reviewer (secondary visibility) |
| Trigger | Pre-invitation planning, pending invitation review, and low-response escalation points. |
| Input | Reviewer expertise/domain signals, current assignment load, invitation statuses, COI outputs, historical completion behavior. |
| Output | Ranked invite list, load-balancing recommendations, response-risk alerts, and fallback reassignment suggestions. |
| Risk/Concern | Biased ranking against early-career reviewers, opaque matching heuristics. |
| Dependency | 5b assignment policy controls (strategy/load caps/SLA) and chair-side assignment mutation endpoints for automation. |
| Recon reference | Section 3: Reviewer Workspace (Invitations/Assignments); Section 4: Reviewer Invitation Lifecycle; Section 5b: Reviewer Assignment Policy |

**Description:**
This copilot improves assignment throughput by helping chairs target likely-accepting, lower-risk reviewers while balancing load. It also shortens cycle time when invitations are declined or stale. It is most effective when coupled with explicit policy controls and automated reassignment hooks.

**Implementation Notes:**
Reviewer-side invitation response contract exists (`respondToReviewRequest`) in `frontend/lib/api/reviewer.ts`, and invitation UX is implemented in `frontend/components/reviewer/reviewer-invitations.tsx`. The codebase does not expose a fully featured chair-side automated assignment writer in current frontend surfaces, so initial release should be recommendation-only.

---

### AI-010: Review Quality and Consistency Auditor (Reviewer-side Guardrail)

| Field | Value |
| --------------- | ---------------------------------- |
| Category | monitoring |
| Impact | High |
| Feasibility | Medium |
| Role(s) | Reviewer, Chair |
| Trigger | Reviewer draft save, submit attempt, and chair review inspection. |
| Input | Rubric scores, recommendation, confidence, narrative feedback sections, optional historical reviewer patterns. |
| Output | Inconsistency flags, missing-justification alerts, language quality checks, and revision suggestions before final submit. |
| Risk/Concern | Over-standardization of reviewer voice, false quality penalties for concise writing. |
| Dependency | Optional rubric template governance and lock/reopen policy controls from 5b for policy-grade enforcement. |
| Recon reference | Section 3: Reviewer Workspace; Section 4: Review Execution Lifecycle; Section 5b: Review Policy and Rubric Control |

**Description:**
This guardrail improves review quality by catching mismatches between scores and written rationale before submission. It can reduce chair-side ambiguity and speed decision cycles. The integration is particularly useful when reviewer populations are heterogeneous.

**Implementation Notes:**
Review save/submit flow and validation already exist in `frontend/components/reviewer/submission-review.tsx`, with persistence via `frontend/hooks/use-assignment-review.ts` and `frontend/lib/api/reviews.ts`. Existing submit validation checks only required presence; AI can extend to consistency/clarity checks without breaking current API contracts.

---

### AI-017: Camera-ready Compliance and Finalization Validator

| Field | Value |
| --------------- | ---------------------------------- |
| Category | monitoring |
| Impact | High |
| Feasibility | Low |
| Role(s) | Author, Chair |
| Trigger | Accepted submission enters camera-ready phase or author attempts revision upload. |
| Input | Accepted paper metadata, camera-ready files, deadline windows, and conference-specific finalization rules. |
| Output | Final compliance verdict, required fixes list, and readiness status for proceedings closure. |
| Risk/Concern | False blocking near hard deadlines, legal/compliance implications if checker is wrong. |
| Dependency | Missing backend camera-ready upload contract + enforceable post-acceptance workflow + 5b camera-ready policy controls. |
| Recon reference | Section 4: Post-Acceptance / Camera-Ready Path; Section 5b: Camera-ready and Post-acceptance Policy |

**Description:**
This validator formalizes the currently partial post-acceptance process into an auditable closure gate. It prevents accepted papers from slipping through with unresolved format/completeness issues. Strategic value is high, but implementation is constrained by missing backend lifecycle contracts.

**Implementation Notes:**
`frontend/lib/api/papers.ts` includes `submitCameraReady` as a placeholder with explicit backend request notes, and author detail UI shows an "Upload Revision" affordance in `frontend/components/author/submission-detail/submission-header.tsx` without full pipeline wiring. This is a dependency-first integration.

---
### AI-007: Discussion Intelligence (Thread Summaries, Consensus Drift, Action Items)

| Field | Value |
| --------------- | ---------------------------------- |
| Category | text-analysis |
| Impact | Medium |
| Feasibility | High |
| Role(s) | Author, Reviewer, Chair |
| Trigger | Thread open, new message posted, or pre-decision evidence review. |
| Input | Discussion threads/messages, visibility scope, role context, and submission state. |
| Output | Auto summaries, unresolved question list, consensus/conflict trend indicators, suggested follow-ups. |
| Risk/Concern | Misread tone/context, accidental visibility leakage if summarization crosses ACL boundaries. |
| Dependency | None for summarization; optional moderation policy controls (5b) for enforcement actions. |
| Recon reference | Section 3: Shared Collaboration; Section 4: Discussion Lifecycle |

**Description:**
Discussion intelligence compresses long thread histories into actionable context for all roles. It improves reviewer/chair coordination and helps authors focus responses on unresolved concerns. Because discussion persistence is already implemented, this can be delivered as a low-friction enhancement.

**Implementation Notes:**
Persisted discussion APIs exist in `frontend/lib/api/discussions.ts`, and role wrappers are active for reviewer, author, and chair discussion tabs (`components/reviewer/submission-review/discussion-tab.tsx`, `components/author/submission-detail/discussion-tab.tsx`, `components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`). The shared rendering surface is `frontend/components/shared/discussion/DiscussionPanel.tsx`.

---

### AI-008: Notification Prioritization and Next-Best-Action Routing

| Field | Value |
| --------------- | ---------------------------------- |
| Category | personalization |
| Impact | Medium |
| Feasibility | High |
| Role(s) | Author, Reviewer, Chair |
| Trigger | Notification arrival, inbox open, unread threshold crossing, or daily digest time. |
| Input | Notification type/history/read state, action URLs, role context, active workflow state. |
| Output | Priority-ranked feed, grouped digests, and role-aware next-best-action shortcuts. |
| Risk/Concern | Over-filtering can hide important updates; ranking bias toward certain event types. |
| Dependency | None for in-app prioritization; preference center in 5b improves controllability. |
| Recon reference | Section 4: Notification and Result Communication; Section 6: Communication Model; Section 5b: Notification and Communication Policy |

**Description:**
This integration improves signal-to-noise in high-volume notification streams. Users receive clearer execution priorities rather than flat chronological lists. It directly supports throughput and deadline adherence across all roles.

**Implementation Notes:**
Current notification stack is complete for in-app operations: REST (`frontend/lib/api/notifications.ts`), websocket push (`frontend/lib/websocket.ts`), state hook (`frontend/hooks/use-notifications.ts`), and legacy deep-link normalization (`frontend/lib/notifications/resolve-action-url.ts`). AI ranking can layer on top of existing payloads without changing transport.

---

### AI-009: Author Submission Drafting Assistant (Title/Abstract/Keywords/Track Fit)

| Field | Value |
| --------------- | ---------------------------------- |
| Category | generative |
| Impact | Medium |
| Feasibility | High |
| Role(s) | Author |
| Trigger | Author edits paper details or requests help before save/publish. |
| Input | Draft title/abstract/keywords/track, conference scope (topics/tracks/CFP), prior draft versions. |
| Output | Rewritten drafts, keyword expansion, clarity suggestions, and track-fit rationale. |
| Risk/Concern | Over-optimized or generic abstracts, author over-reliance, potential claim hallucination. |
| Dependency | None for assistive drafting; optional disclosure policy. |
| Recon reference | Section 3: Author Workspace; Section 4: Author Submission Lifecycle; Section 5a: Conference Configuration |

**Description:**
This assistant improves author productivity and baseline submission quality early in the flow. It can reduce preventable desk rejects caused by unclear abstracts or weak track alignment. The integration is straightforward because the author form surface is already rich and structured.

**Implementation Notes:**
Primary hook points are `frontend/components/author/submit/paper-submission-form.tsx` and its step components. Existing precheck results (`file-upload-step.tsx`) can be combined with generative rewrite suggestions to create a closed feedback loop before publish.

---

### AI-011: Reviewer Workload, Deadline-Risk, and SLA Predictor

| Field | Value |
| --------------- | ---------------------------------- |
| Category | decision-support |
| Impact | Medium |
| Feasibility | Medium |
| Role(s) | Reviewer, Chair |
| Trigger | Dashboard load, invitation list updates, or upcoming due-date windows. |
| Input | Reviewer assignment counts, invitation states, due dates, completion history, conference phase. |
| Output | Workload risk score, probable late-review alerts, and reassignment/reminder suggestions. |
| Risk/Concern | Self-fulfilling labels and fairness concerns if predictions affect assignment opportunities. |
| Dependency | 5b invitation SLA controls for automated escalation/reminders; transparent override policy. |
| Recon reference | Section 3: Reviewer Workspace; Section 4: Reviewer Invitation Lifecycle; Section 4: Review Execution Lifecycle; Section 5b: Reviewer Assignment Policy |

**Description:**
This predictor helps chairs and reviewers avoid deadline bottlenecks by surfacing risk early. It supports better load balancing and fewer last-minute review gaps. Value is medium-high in large conferences with uneven reviewer responsiveness.

**Implementation Notes:**
Data sources already exist in reviewer APIs: dashboard/invitations/assignments in `frontend/lib/api/reviewer.ts` and completed paper endpoints in `frontend/lib/api/reviews.ts`. Initial rollout can remain advisory without changing invitation or assignment write contracts.

---

### AI-012: Chair Natural-Language Conference Configuration Assistant

| Field | Value |
| --------------- | ---------------------------------- |
| Category | agentic |
| Impact | Medium |
| Feasibility | Medium |
| Role(s) | Chair |
| Trigger | Conference creation/edit and "configure from prompt" actions. |
| Input | Chair natural language intent, existing form state, conference schema constraints, prior conference templates. |
| Output | Proposed config diff mapped to concrete fields, validation warnings, and one-click apply preview. |
| Risk/Concern | Misinterpreted prompts causing invalid policies or conflicting dates. |
| Dependency | Advanced policies require 5b config surfaces; current implementation can only target 5a persisted fields. |
| Recon reference | Section 4: Conference Setup and Configuration; Section 5a: Implemented Configuration; Section 5b: Implied Configuration |

**Description:**
This assistant compresses multi-step setup effort into prompt-driven configuration while keeping chair review in control. It reduces setup friction for recurring conferences and first-time organizers. Immediate scope should map only to persisted fields, with inferred policy extensions phased later.

**Implementation Notes:**
Conference creation payload mapping is explicit in `frontend/app/role/chair/conferences/new/page.tsx` and persisted through `createConference` in `frontend/lib/api/conferences.ts`. The same page has a toast-only draft behavior (non-persistent), so assistant UX should distinguish preview/local changes from committed backend updates.

---
### AI-013: CFP Drafting/Rewriting/Localization Assistant

| Field | Value |
| --------------- | ---------------------------------- |
| Category | generative |
| Impact | Medium |
| Feasibility | Medium |
| Role(s) | Chair (authoring), Author/Reviewer (consumers) |
| Trigger | CFP creation/update workflow, conference launch, or policy/date changes. |
| Input | Conference metadata, topics/tracks/dates, review type, prior CFP text, target language/style. |
| Output | Draft CFP variants (long/short), localized versions, and consistency checks against configured dates/policies. |
| Risk/Concern | Inconsistent policy statements, translation quality errors, outdated deadlines in generated copy. |
| Dependency | Full edit/publish lifecycle in conference detail is currently read-only; template governance from 5b improves control. |
| Recon reference | Section 3: Chair Workspace; Section 4: Conference Setup and Configuration; Section 5a: CFP text persistence; Section 5b: Communication Policy |

**Description:**
This integration improves CFP quality and speed, especially for multilingual or multi-track conferences. It also reduces divergence between operational configuration and public-facing call text. Value is strongest when conferences iterate yearly with similar templates.

**Implementation Notes:**
CFP text is included in creation/update conference configuration (`call_for_paper_text` in `frontend/lib/api/conferences.ts`). Chair detail CFP view currently signals read-only publishing workflows (`frontend/components/chair/conference-detail/conference-cfp.tsx`), so authoring scope should begin in creation/edit flows.

---

### AI-014: Semantic Search Across Submissions, Reviews, and Discussions

| Field | Value |
| --------------- | ---------------------------------- |
| Category | search |
| Impact | Medium |
| Feasibility | Medium |
| Role(s) | Chair, Reviewer, Author |
| Trigger | User query in role dashboards, submission lists, discussion history, or decision prep. |
| Input | Submission metadata/text, review content, discussion messages, and notification/action metadata with role ACL context. |
| Output | Intent-aware ranked results, similarity links, and context snippets by role scope. |
| Risk/Concern | Cross-role data leakage and privacy violations if ACL enforcement is weak. |
| Dependency | Embedding/index backend and strict role-aware retrieval controls. |
| Recon reference | Section 3: Feature Map (all role workspaces); Section 4: Review/Discussion/Decision workflows; Section 6: Communication Model |

**Description:**
Semantic retrieval reduces time spent manually traversing submissions, reviews, and discussions. It is especially useful for chairs synthesizing many borderline papers and reviewers finding related prior threads. The feature becomes a multiplier when paired with decision and discussion intelligence.

**Implementation Notes:**
Current frontend largely uses lexical filters/sorting across role pages; no semantic index contract is present. Candidate source feeds already exist through submissions/reviews/discussions/notifications APIs (`frontend/lib/api/submissions.ts`, `frontend/lib/api/reviews.ts`, `frontend/lib/api/discussions.ts`, `frontend/lib/api/notifications.ts`).

---

### AI-019: Role-Personalized Daily Briefing Feed

| Field | Value |
| --------------- | ---------------------------------- |
| Category | personalization |
| Impact | Medium |
| Feasibility | Medium |
| Role(s) | Author, Reviewer, Chair |
| Trigger | Login, first dashboard visit of day, or scheduled digest time. |
| Input | Active role, deadlines, unread notifications, pending submissions/reviews/decisions, and recent workflow events. |
| Output | Short daily briefing with prioritized tasks and direct action links per role. |
| Risk/Concern | Hidden-priority bias and notification overload if summarization is noisy. |
| Dependency | None for in-app briefings; 5b preference settings improve user control over digest style/frequency. |
| Recon reference | Section 2: Multi-role behavior; Section 3: Role workspaces; Section 4: Core workflows; Section 6: Communication Model |

**Description:**
Daily briefings reduce context-switching and help users start with the highest-impact tasks. This is a lightweight personalization layer with broad role coverage. It also complements notification prioritization by turning event streams into actionable agenda.

**Implementation Notes:**
Role switching and route context are already managed in auth/session (`frontend/lib/auth-context.tsx`, `frontend/lib/session-manager.ts`), and role-specific dashboards plus notifications are available. Briefing generation can be rendered as a dashboard card and progressively enriched with predictive signals.

---

### AI-015: Communication Policy Assistant (Template + Preference Intelligence)

| Field | Value |
| --------------- | ---------------------------------- |
| Category | personalization |
| Impact | Medium |
| Feasibility | Low |
| Role(s) | Chair |
| Trigger | Conference communication setup, reminder planning, and campaign tuning cycles. |
| Input | Notification event history, role engagement patterns, message templates, and policy targets. |
| Output | Recommended cadence/channel policy, template variants, and audience segmentation guidance. |
| Risk/Concern | Communication inequity, over-notification fatigue, and policy opacity. |
| Dependency | 5b-not-implemented preference center + template management; outbound email channel contracts (frontend currently in-app only). |
| Recon reference | Section 5b: Notification and Communication Policy; Section 6: Communication Model |

**Description:**
This assistant optimizes how chairs communicate operational updates and reminders. It can raise engagement and reduce ignored notifications when policy controls exist. Current feasibility is low because key policy surfaces are inferred (not implemented) and email dispatch is not frontend-backed.

**Implementation Notes:**
Notification infra today is in-app + websocket only (`frontend/lib/api/notifications.ts`, `frontend/lib/websocket.ts`, `frontend/hooks/use-notifications.ts`). Recon and code do not show direct frontend email send logic, so this integration is dependency-heavy until communication governance primitives are added.

---

### AI-016: Rebuttal Coach and Response Quality Analyzer

| Field | Value |
| --------------- | ---------------------------------- |
| Category | generative |
| Impact | Medium |
| Feasibility | Low |
| Role(s) | Author, Reviewer, Chair |
| Trigger | Rebuttal tab entry, rebuttal draft attempt, or reviewer acknowledgment cycle. |
| Input | Reviewer comments, point-by-point rebuttal content, discussion context, and role permissions. |
| Output | Suggested responses, coverage gaps, tone checks, and reviewer follow-up prompts. |
| Risk/Concern | Over-coached persuasive writing, confidentiality and fairness concerns, unsupported write state. |
| Dependency | Rebuttal persistence APIs + role-aware write endpoints and phase controls (currently absent). |
| Recon reference | Section 3: Rebuttal panel surface; Section 4: Rebuttal / Author Response Surface; Section 5b: Rebuttal Policy |

**Description:**
This capability could significantly improve rebuttal quality and reviewer response efficiency once rebuttal is operational. It is strategically valuable but currently blocked by missing write contracts. Near-term value is limited to read-only coaching overlays.

**Implementation Notes:**
Both author and reviewer rebuttal tabs explicitly state write actions are disabled and include backend-request comments (`frontend/components/author/submission-detail/rebuttal-tab.tsx`, `frontend/components/reviewer/submission-review/rebuttal-tab.tsx`). Shared rebuttal UI (`frontend/components/shared/rebuttal/RebuttalPanel.tsx`) supports action components but is invoked with `readOnly` in current role tabs.

---

### AI-018: Schedule Optimization and Conflict-Aware Session Planning

| Field | Value |
| --------------- | ---------------------------------- |
| Category | decision-support |
| Impact | Medium |
| Feasibility | Low |
| Role(s) | Chair |
| Trigger | Schedule planning updates, milestone changes, or publication prep. |
| Input | Conference timelines, event dependencies, reviewer/chair availability, accepted-paper/session constraints. |
| Output | Optimized timeline/session proposals, clash warnings, and what-if scenario comparisons. |
| Risk/Concern | Bad recommendations from synthetic data, over-trust in non-authoritative schedule model. |
| Dependency | Real schedule backend contracts/data (current surface is mock), plus 5b scheduling policy settings. |
| Recon reference | Section 3: Chair Workspace (Schedules); Section 5a: Planning surface synthetic behavior; Section 5b: Scheduling Policy |

**Description:**
This integration can materially improve planning quality for large conferences with tight timelines. However, current scheduling surfaces are synthetic and not grounded in authoritative backend data. It should be treated as a later-phase initiative after schedule data contracts are implemented.

**Implementation Notes:**
The chair schedules page uses hardcoded mock models (`MOCK_EVENTS`, `MOCK_CONFERENCES`) in `frontend/app/role/chair/schedules/page.tsx`. Without real schedule persistence and constraints APIs, AI optimization output cannot be reliably validated or enforced.

---
## Priority Matrix

| ID | Title | Impact | Feasibility | Role(s) | Category |
| ------ | ----- | ------ | ----------- | ------- | -------- |
| AI-001 | Conference Agent (Cross-role Conversational Operator) | High | Medium | Author, Reviewer, Chair | agentic |
| AI-002 | Submission Material Gating | High | Medium | Chair, Author | monitoring |
| AI-003 | Reviewer Pre-Read Submission Analysis Briefing | High | Medium | Reviewer, Chair | text-analysis |
| AI-006 | Chair Decision Copilot | High | High | Chair | decision-support |
| AI-005 | COI Risk Detection and Assignment Guardrails | High | Medium | Chair | monitoring |
| AI-004 | Reviewer Assignment and Invitation Prioritization Copilot | High | Medium | Chair, Reviewer | decision-support |
| AI-010 | Review Quality and Consistency Auditor | High | Medium | Reviewer, Chair | monitoring |
| AI-017 | Camera-ready Compliance and Finalization Validator | High | Low | Author, Chair | monitoring |
| AI-007 | Discussion Intelligence | Medium | High | Author, Reviewer, Chair | text-analysis |
| AI-008 | Notification Prioritization and Next-Best-Action Routing | Medium | High | Author, Reviewer, Chair | personalization |
| AI-009 | Author Submission Drafting Assistant | Medium | High | Author | generative |
| AI-011 | Reviewer Workload, Deadline-Risk, and SLA Predictor | Medium | Medium | Reviewer, Chair | decision-support |
| AI-012 | Chair Natural-Language Conference Configuration Assistant | Medium | Medium | Chair | agentic |
| AI-013 | CFP Drafting/Rewriting/Localization Assistant | Medium | Medium | Chair (primary) | generative |
| AI-014 | Semantic Search Across Submissions, Reviews, and Discussions | Medium | Medium | Author, Reviewer, Chair | search |
| AI-019 | Role-Personalized Daily Briefing Feed | Medium | Medium | Author, Reviewer, Chair | personalization |
| AI-015 | Communication Policy Assistant | Medium | Low | Chair | personalization |
| AI-016 | Rebuttal Coach and Response Quality Analyzer | Medium | Low | Author, Reviewer, Chair | generative |
| AI-018 | Schedule Optimization and Conflict-Aware Session Planning | Medium | Low | Chair | decision-support |

---

## Coverage Audit

| Recon Section | AI Integrations Found | Notes |
| ------------------------------------------- | --------------------- | ---------------------------------------------------- |
| 1. Platform Summary | AI-001, AI-019 | Cross-role orchestration and daily execution guidance map directly to end-to-end lifecycle management. |
| 2. User Roles | AI-001, AI-004, AI-019 | Role-aware behavior is central; admin is explicitly excluded from primary targets because no routed admin workspace exists. |
| 3. Feature Map | AI-001, AI-002, AI-003, AI-005, AI-007, AI-008, AI-009, AI-012, AI-013, AI-014 | Covers identity/role context, all role workspaces, and shared collaboration/communication surfaces. |
| 4. Core Workflows | AI-002, AI-003, AI-004, AI-006, AI-007, AI-008, AI-010, AI-016, AI-017, AI-018 | Each major workflow has at least one integration; rebuttal and camera-ready are included with dependency-gated low feasibility. |
| 5a. Implemented Configuration | AI-002, AI-006, AI-012, AI-013 | Immediate integrations leverage persisted conference config, decision controls, and current creation/edit contracts. |
| 5b. Implied Configuration (not implemented) | AI-004, AI-010, AI-012, AI-015, AI-016, AI-017, AI-018 | Lower feasibility where policy infrastructure is inferred-only (assignment SLA, rubric governance, comm preferences/templates, rebuttal/camera-ready/scheduling policies). |
| 6. Communication Model | AI-001, AI-008, AI-015, AI-019 | Built on in-app notifications + websocket push + deep-link routing; no direct frontend email dispatch assumed. |

---

## Recommended Starting Points

1. **AI-002 — Submission Material Gating**  
This is the fastest high-impact quality lever because precheck plumbing already exists in the author upload path and API contracts. It can start as soft-gate plus remediation and then graduate to strict enforcement once policy persistence and plagiarism/reference services are integrated. Strategically, it protects reviewer capacity and raises baseline submission quality.

2. **AI-003 — Reviewer Pre-Read Submission Analysis Briefing**  
Reviewer UI already has an AI assistant affordance with mock behavior, so replacement with a real analysis pipeline is straightforward. The integration directly improves reviewer speed and consistency before scoring starts. It creates reusable analysis artifacts for chairs as a secondary benefit.

3. **AI-006 — Chair Decision Copilot**  
Chair decision pages already aggregate reviews, analytics, discussion, and history in one place, enabling an evidence-synthesis layer without major UX rework. This improves high-stakes decision consistency while keeping final authority with chairs. It is one of the few high-impact opportunities with high feasibility today.

4. **AI-001 — Conference Agent**  
A baseline conversational agent is already embedded globally, reducing initial UX and infrastructure lift. Phase 1 can focus on read/query/navigation with strict role boundaries; Phase 2 can add audited action tools for approved operations. This becomes the cross-role control plane for later integrations.

5. **AI-005 — COI Risk Detection and Guardrails**  
COI data and rebuild operations are already API-backed, giving immediate analytical input for explainable risk flags. Initial releases can focus on transparent recommendation layers before moderation/reassignment writes are available. This materially supports fairness and trust in assignment decisions.
