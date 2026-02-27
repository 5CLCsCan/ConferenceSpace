# Platform Reconnaissance — ConferenceSpace

> Purpose: Complete platform understanding for Phase 2 AI integration analysis.
> Quality bar: A new team member can onboard from this document alone.

## 1. Platform Summary

ConferenceSpace is a role-based conference operations platform that coordinates the full paper lifecycle across authors, reviewers, and chairs in one workspace. The frontend is organized around role-scoped applications with shared collaboration modules, so the same user account can change active role context and operate in different capacities without switching systems.

At a product level, the system solves the operational fragmentation of academic conference management. It brings conference setup, call-for-papers data, submission intake, reviewer invitation handling, review execution, discussion threads, chair decisions, and user notifications into a unified flow. The product model assumes that chairs govern policy and outcomes, reviewers evaluate assigned work, and authors submit and track manuscripts.

The lifecycle managed by the current frontend is: conference creation and configuration, submission drafting/publishing, reviewer invitation response and assignment access, review drafting/submission, cross-role discussion, decision finalization, and result communication through in-app notifications with real-time updates. Rebuttal and camera-ready surfaces exist in the UI, but write/persistence coverage is partial: rebuttal write actions are disabled in current frontend contracts, and post-acceptance revision handling is not a complete backend-enforced pipeline.

ConferenceSpace should be understood as a production-capable core workflow platform with some intentionally exposed, clearly limited surfaces (read-only, synthetic, or backend-blocked) that indicate planned expansion areas.

## 2. User Roles

### Chair

- **Context:** The conference owner/operator (program chair or organizing chair) who defines conference operations and is accountable for acceptance outcomes.
- **Responsibilities:** Create and configure conferences, oversee submission/review progress, inspect conflicts-of-interest (COI) information, and make final decisions.
- **Capabilities:** Manage a portfolio of conferences; run conference setup via wizard; monitor submissions, review activity, and conference analytics; inspect conference detail areas (overview/CFP/dates/committee/submissions/COI/dashboard); trigger COI index rebuild operations; and persist submission decisions in supported terminal states (`accepted`/`rejected`).

### Reviewer

- **Context:** An invited evaluator responsible for scholarly assessment of assigned submissions.
- **Responsibilities:** Respond to review invitations, evaluate assigned papers, submit scored/justified reviews, and participate in discussion threads.
- **Capabilities:** View reviewer dashboard and assignment queues; accept or reject invitations; open assignment detail and review forms; save review drafts or submit final reviews (with validation gating required inputs); see completed review history; contribute to discussion threads; and access rebuttal content in read-only form where exposed.

### Author

- **Context:** A researcher submitting work to conferences and tracking evaluation outcomes.
- **Responsibilities:** Discover suitable conferences, submit papers, maintain draft/published submissions, and monitor review/decision progression.
- **Capabilities:** Browse conference listings and details; create new submissions; save draft or publish submission states; edit existing submissions (especially draft lifecycle paths); access submission-centric collaboration tabs (overview/discussion/rebuttal); participate in discussion threads; monitor status changes and decision notifications.

### Admin (latent, non-routed)

- **Context:** A type-level/system-level administrative identity represented in auth and role models.
- **Responsibilities:** Not defined as a standalone product workflow in current routed frontend.
- **Capabilities:** `admin` is present in type validation and role mapping logic but does not have a dedicated admin workspace/journey in active frontend routing; it currently resolves to role selection rather than a distinct admin console.

### Multi-role behavior

- **Context:** One account can act in different real-world capacities (for example, someone can be both author and reviewer).
- **Responsibilities:** Operate within the currently selected role context while preserving role-specific permissions and route guards.
- **Capabilities:** Switch active role context and access role-specific dashboards/workflows accordingly; capabilities differ materially by role even for the same authenticated user.

## 3. Feature Map

### Identity, Authentication, and Role Context

- **Authentication and session management:** Supports login/authenticated route protection and user session continuity for all role workspaces.
- **Role-aware routing and guards:** Enforces role-specific access boundaries for author/reviewer/chair application areas.
- **Role selection/switching:** Allows users with multiple role grants to change active operating context without creating separate accounts.
- **Profile and account surface:** Provides user-level profile/account management features shared across role contexts.

### Author Workspace

- **Conference discovery and intake:** Authors can discover available conferences, inspect conference information, and decide where to submit.
- **Submission lifecycle management:** Authors can create submissions, save drafts, publish submissions, and return to update content through allowed lifecycle paths.
- **Submission detail workspace:** Each submission has a unified workspace with overview state, discussion participation, and rebuttal visibility (read-only where write is blocked).
- **Status tracking:** Authors can monitor progression from draft/published through review and decision outcomes.

### Reviewer Workspace

- **Reviewer operations dashboard:** Gives reviewers a centralized view of active responsibilities and progress.
- **Invitations and assignment access:** Reviewers receive invitations and explicitly accept/reject before proceeding into assignment execution paths.
- **Review authoring and submission:** Reviewers create evaluations with scoring and narrative justification, with draft-save and final-submit states.
- **Completed review archive:** Reviewers can revisit completed work history for traceability and personal workflow management.

### Chair Workspace

- **Chair dashboard and portfolio:** Chairs can oversee conference-level health and navigate across managed conferences.
- **Conference creation wizard:** Chairs can launch new conferences with operational metadata, policy inputs, and timeline definitions.
- **Conference operations hub:** Conference detail tabs centralize overview, CFP visibility, dates, committee context, submissions, COI, and dashboard information.
- **Decisioning surface:** Chairs review submission evidence and persist final acceptance outcomes in currently supported decision states.
- **COI monitoring and maintenance:** Chairs can view COI analytics/relationships and trigger index rebuild operations.
- **Schedule/planning surface:** A scheduling interface exists to support planning visibility, currently with synthetic/mock-heavy data behavior.

### Shared Collaboration and Communication

- **Discussion threads:** Cross-role threaded discussion is implemented and persisted, supporting conversation around submissions.
- **Rebuttal panel surface:** Rebuttal visibility exists, but write paths are currently disabled/read-only due to absent backend contract support.
- **Notification center:** In-app notifications aggregate workflow events with unread counts, read-state controls, and action/deep-link navigation.
- **Real-time event ingestion:** WebSocket push updates notification state in near-real time in addition to REST polling/loading.

## 4. Core Workflows

### Conference Setup and Configuration

**Trigger:** A chair decides to open a new conference cycle and initiates conference creation.
**Roles involved:** Chair.

The chair enters conference setup through the creation wizard and defines conference identity, operational context, policy-oriented settings, and key dates. On submit, the frontend persists supported configuration payloads through conference creation APIs and adds the new conference to the chair’s managed portfolio.

A key decision point is whether the chair completes a persistent create action versus non-persistent UI actions (for example, save-draft-like interactions that do not commit full backend state). Another branch appears where some setup controls are visible in UI but only partially mapped to persistence contracts, producing a split between “configured in UI” and “authoritatively stored.”

**Outcomes:** Conference is created and becomes operationally visible in chair views when persistence succeeds; otherwise the chair remains in setup/edit loop. UI-only controls can appear configured locally but do not produce durable backend behavior.

### Author Submission Lifecycle

**Trigger:** An author chooses a conference and starts a new submission (or edits an existing one).
**Roles involved:** Author.

The author enters submission creation from conference context, prepares the submission package, and chooses whether to save as `draft` or move to `published`. The frontend supports draft iteration and publish transitions as explicit status branches. Authors can return to submission detail to continue collaboration and status tracking.

The primary decision point is draft-save versus publish, which changes downstream visibility/readiness for review workflows. A second branch occurs when conference intake state is not open: submission initiation is blocked/redirected rather than proceeding. Editing behavior also branches by submission state, with draft-oriented paths offering greater mutability than later lifecycle states.

**Outcomes:** Submission persists as draft for continued author iteration, or as published and eligible for downstream review operations. If submission is blocked by conference state, author is prevented from entering normal intake flow.

### Reviewer Invitation Lifecycle

**Trigger:** Reviewer invitation becomes available to a reviewer (initiated by chair process/backend assignment pipeline).
**Roles involved:** Reviewer (chair/backend as upstream initiator).

The reviewer receives invitation items in reviewer workspace and evaluates whether to participate. The reviewer explicitly accepts or rejects each invitation through invitation response actions; accepted invitations unlock assignment execution surfaces, while rejected invitations close reviewer participation for that item.

The central decision point is acceptance versus rejection. Acceptance advances the submission into reviewer workload; rejection requires reassignment or reduced reviewer pool coverage upstream.

**Outcomes:** Accepted invitations open review assignment workflows; rejected invitations terminate that reviewer’s path for the submission and require chair/backend reassignment handling.

### Review Execution Lifecycle

**Trigger:** Reviewer opens an accepted assignment.
**Roles involved:** Reviewer.

The reviewer performs evaluation using the assignment review interface, entering scores/justifications and recommendation/confidence data. The reviewer can save progress as draft or submit a final review.

Decision points include draft-save versus final-submit and validation pass/fail. Final submission is blocked until required evaluation components are present; reviewers can iteratively refine draft content until validation criteria are met. Once submitted, review state is treated as completed in reviewer workflow and becomes available for chair decision context.

**Outcomes:** Draft review is stored for later completion, or finalized review is submitted and exposed for downstream decision-making. Validation failures keep the review in editable state.

### Discussion Lifecycle

**Trigger:** A participant opens submission discussion and starts or replies to a thread.
**Roles involved:** Author, Reviewer, Chair.

Discussion threads/messages are persisted via discussion APIs and become a shared conversation record within submission context. Participants can create threads, post replies, and re-enter ongoing discussions from role-specific workspaces.

Decision points are conversational and moderation-oriented rather than form-status oriented: users decide whether to open new threads, respond in existing threads, or defer participation. Visibility/participation behavior can differ by role/context in UI framing, but persisted thread state is shared at submission level.

**Outcomes:** Discussion history accumulates as a durable collaboration artifact that informs reviewer/chair/author coordination and can affect downstream decisions.

### Rebuttal / Author Response Surface

**Trigger:** User opens rebuttal tab in submission-related workflow.
**Roles involved:** Author, Reviewer, Chair (as readers in current frontend behavior).

Rebuttal UI is present as a product surface, but write actions are disabled/read-only in active frontend integration due missing backend contracts. Users can view rebuttal-related context where available but cannot execute a complete author-response submission cycle through current write APIs.

The key branch is capability availability: read-only display path exists, while write path is blocked. This creates a functional split between “workflow represented” and “workflow executable.”

**Outcomes:** Rebuttal remains informational in current implementation; no authoritative rebuttal submission/update lifecycle is completed end-to-end.

### Chair Decision Workflow

**Trigger:** Chair reviews completed evaluation context for a submission and initiates decision action.
**Roles involved:** Chair.

The chair inspects submission evidence (reviews, history, discussions, analytics context) and selects an outcome. In current persisted flow, decision write supports accepted/rejected terminal outcomes. UI traces of revision-oriented outcomes exist but are disabled/non-persistent in active decision action path.

Critical decision point is decision selection. Branching is constrained by backend-supported persistence states: accepted/rejected are executable, while revision-like alternatives remain unavailable in current durable contract.

**Outcomes:** Submission status transitions to accepted or rejected and unlocks corresponding communication/state transitions. Unsupported decision branches do not persist and remain inactive for operations.

### Notification and Result Communication

**Trigger:** System events (submission/review/discussion/status/decision/deadline classes) generate user-facing notifications.
**Roles involved:** Author, Reviewer, Chair.

Notifications are delivered into in-app feeds and unread counters through REST retrieval plus WebSocket push. Users open notification center surfaces, mark individual notifications read, mark all read, delete entries, and follow action links that resolve to role-aware routes (including legacy deep-link remapping).

Decision points include whether to act immediately from notification, defer by leaving unread, or bulk-clear for inbox hygiene. Navigation branch logic resolves action URLs into role-correct destinations when legacy paths are encountered.

**Outcomes:** Users receive timely state-change awareness; read-state transitions reduce unread counts; deep links move users directly into the next operational task.

### Post-Acceptance / Camera-Ready Path

**Trigger:** A submission reaches acceptance and participants move to finalization expectations.
**Roles involved:** Chair, Author.

The frontend exposes camera-ready/date-related surfaces and includes an upload-revision style affordance in submission context, indicating intended post-acceptance progression. However, the full camera-ready pipeline (policy enforcement, revision gating, verification, and final closure) is not fully realized as a complete backend-enforced journey in current frontend integration.

Decision points include whether accepted work requires revision upload and whether operational enforcement exists for deadlines/compliance. In current state, visible UI intent can exceed persisted workflow guarantees.

**Outcomes:** Post-acceptance handling is partially represented in UI and timeline data but does not yet provide a full, authoritative, enforceable camera-ready completion lifecycle.

## 5. Configuration and Customization

### 5a. Implemented configuration

ConferenceSpace currently exposes organizer-facing configuration through chair workflows, with mixed levels of persistence maturity.

- **Conference creation configuration (persisted):** Chairs can set core conference metadata, scope descriptors, timeline milestones, review-type mode, submission constraints (such as page/file-format policy fields), and CFP text as part of conference creation payloads. These settings affect author intake behavior, reviewer process framing, and chair operations visibility.
- **Operational conference management views (implemented):** Chairs can use submissions/COI/dashboard-oriented operational views with filters/search and role workflows to monitor and act on conference state.
- **Decision-state control (persisted):** Chairs can set submission outcomes to `accepted` or `rejected` in current decision write flow, directly controlling downstream status and communication.
- **COI maintenance trigger (persisted action):** Chairs can trigger COI index rebuild operations to refresh conflict analytics/relationships used in oversight.
- **Read-only operational sections (implemented UI, limited mutability):** Some conference detail areas (notably CFP management in detail context) are present primarily as read/inspect surfaces, with explicit backend blocker notes for mutation.
- **Planning/scheduling controls (implemented UI, synthetic data behavior):** Chair schedule/planning surfaces are visible and navigable but rely on mock/synthetic model behavior rather than full authoritative backend persistence.
- **Wizard/control surfaces with partial persistence mapping (implemented UI, partially non-persistent):** Some setup controls and save-like interactions exist in creation/planning UX but do not currently map to fully durable backend state changes.

### 5b. Implied configuration — `[Inferred — not implemented]`

#### Setup and Governance

- **[Inferred — not implemented] `Conference visibility mode`** — **What it controls:** Whether a conference is publicly discoverable, invite-only, or hidden during drafting. **Why it matters:** Without explicit visibility governance, chairs cannot safely stage or soft-launch conferences.
- **[Inferred — not implemented] `Role delegation and co-chair permissions`** — **What it controls:** Which organizers can perform high-impact actions (decisions, policy edits, assignment overrides). **Why it matters:** Without permission granularity, operational continuity and accountability are weak in multi-organizer teams.

#### Submission Policy

- **[Inferred — not implemented] `Submission window enforcement policy`** — **What it controls:** Hard/soft handling for late submissions and extension logic by track. **Why it matters:** Without policy controls, chairs must enforce deadlines manually and inconsistently.
- **[Inferred — not implemented] `Blind-review identity visibility`** — **What it controls:** Single-blind vs double-blind identity exposure across author/reviewer/chair contexts. **Why it matters:** Without explicit anonymity mode, conferences cannot align platform behavior with review ethics policy.

#### Reviewer Assignment Policy

- **[Inferred — not implemented] `Assignment strategy and load balancing`** — **What it controls:** Automatic/manual matching weights, reviewer load caps, and fallback reassignment behavior. **Why it matters:** Without this, invitation acceptance/rejection can produce uneven coverage and manual firefighting.
- **[Inferred — not implemented] `Invitation response SLA`** — **What it controls:** Response deadlines, reminder cadence, and expiration behavior for pending invitations. **Why it matters:** Without SLA controls, assignment latency can delay the entire review timeline.

#### Review Policy and Rubric Control

- **[Inferred — not implemented] `Rubric template per conference/track`** — **What it controls:** Score dimensions, recommendation scales, and required narrative sections. **Why it matters:** Without configurable rubrics, review quality and comparability vary across reviewers.
- **[Inferred — not implemented] `Draft vs final submission lock rules`** — **What it controls:** Edit permissions after final review submit and conditions for reopening reviews. **Why it matters:** Without lock policy, auditability and fairness in decision evidence can be compromised.

#### Discussion Policy

- **[Inferred — not implemented] `Discussion visibility and participation matrix`** — **What it controls:** Who can start/read/reply in discussions at each phase. **Why it matters:** Without explicit matrix control, confidentiality and collaboration expectations are unclear.
- **[Inferred — not implemented] `Discussion moderation controls`** — **What it controls:** Thread freezing, moderation rights, and escalation routing. **Why it matters:** Without moderation policy, high-conflict cases can disrupt review operations.

#### Rebuttal Policy

- **[Inferred — not implemented] `Rebuttal activation window`** — **What it controls:** Whether rebuttal is enabled, when it opens/closes, and which submissions are eligible. **Why it matters:** Without this, rebuttal cannot function as an enforceable stage in decision workflows.
- **[Inferred — not implemented] `Rebuttal response constraints`** — **What it controls:** Length/format limits and revision allowances for author responses. **Why it matters:** Without constraints, rebuttal quality and fairness become inconsistent.

#### Decision Policy

- **[Inferred — not implemented] `Decision taxonomy`** — **What it controls:** Allowed decision outcomes beyond accept/reject (for example conditional accept, major/minor revision). **Why it matters:** Without richer taxonomy, chairs cannot encode nuanced outcomes that match real conference practice.
- **[Inferred — not implemented] `Decision quorum and override rules`** — **What it controls:** Required review counts/consensus thresholds and who can override defaults. **Why it matters:** Without quorum rules, decision consistency depends on ad hoc judgment.

#### Notification and Communication Policy

- **[Inferred — not implemented] `Notification preference center`** — **What it controls:** Per-role/event-channel opt-in/opt-out behavior and digest frequency. **Why it matters:** Without preferences, users receive either too little or too much communication.
- **[Inferred — not implemented] `Template and localization management`** — **What it controls:** Standardized message templates and multilingual variants for key events. **Why it matters:** Without managed templates, communication tone and clarity drift across conferences.

#### Camera-ready and Post-acceptance Policy

- **[Inferred — not implemented] `Camera-ready compliance workflow`** — **What it controls:** Revision required flags, final file checks, and acceptance-to-final closure gating. **Why it matters:** Without enforceable camera-ready workflow, accepted-paper finalization remains operationally ambiguous.
- **[Inferred — not implemented] `Post-acceptance deadline enforcement`** — **What it controls:** Automated reminders, late handling, and lock behavior after camera-ready deadline. **Why it matters:** Without enforcement, chairs must manually chase final artifacts.

#### COI Policy

- **[Inferred — not implemented] `COI rule set configuration`** — **What it controls:** Conflict detection criteria, severity thresholds, and auto-flag behavior. **Why it matters:** Without tunable rules, COI analysis may underfit or overfit different conference norms.
- **[Inferred — not implemented] `COI adjudication workflow`** — **What it controls:** Human review/override states for flagged conflicts and assignment constraints. **Why it matters:** Without adjudication workflow, COI findings cannot be consistently operationalized.

#### Scheduling Policy

- **[Inferred — not implemented] `Schedule publication states`** — **What it controls:** Draft/internal/public schedule visibility and release timing. **Why it matters:** Without publication states, organizers cannot coordinate planning before public announcement.
- **[Inferred — not implemented] `Session planning constraints`** — **What it controls:** Capacity, track/session compatibility, and conflict-aware time-slot rules. **Why it matters:** Without constraints, schedule quality depends on manual spreadsheet-level coordination.

## 6. Communication Model

ConferenceSpace uses an in-app, event-driven communication model centered on notifications plus real-time push. The frontend defines notification categories covering submission intake, review assignment/submission, decision outcomes (accept/reject), status changes, deadline reminders, and discussion events (thread/message activity). These map to a unified notification feed and unread count surfaces available to authenticated users.

Communication is triggered by workflow events rather than manual inbox composition. As submission/review/discussion/decision states change, notification records are retrieved and managed through REST APIs (list, unread count, mark-read, mark-all-read, delete), while a WebSocket channel pushes new notifications to connected clients. This gives users both durable history and near-real-time awareness.

Recipients are role-context dependent: authors are informed about submission/decision/discussion activity, reviewers about invitation/assignment/review/discussion activity, and chairs about operational events across their conferences. Notification action links route users into next-step pages; a deep-link resolver translates legacy dashboard paths into current role-based route destinations.

Current frontend implementation is explicitly an in-app channel model with real-time socket delivery. Email-style reminder language appears in product copy, but there is no direct frontend email dispatch implementation in the reviewed codebase; any outbound email behavior would need to be provided by backend infrastructure outside current client logic.
