# Agent Query Engine Discovery

## User Problem

ConferenceSpace needs an agent-usable query capability that can answer user-specific questions such as:
- an author asking for the current status of a submission in a given conference
- a chair asking for a compact report across all chaired conferences

The feature must stay flexible enough for agent-driven analysis and summarization, but it must not let one user inspect another user's data or bypass conference visibility rules.

## Current System Reality

The repo is split across three relevant surfaces:
- `backend/` is the Go API and owns the domain tables, controllers, and data access.
- `ai-service/` is the Python agent runtime and tool orchestration service.
- `frontend/` currently executes client tools for the chatbot.

Relevant backend observations:
- Auth is enforced through JWT middleware in `backend/internal/middleware/auth.go`.
- The backend already exposes data-rich controllers for conferences, submissions, reviewers, assignments, notifications, and discussions.
- Some existing read paths are too open to trust as a base abstraction for the agent engine:
  - discussion reads currently fetch reviewer identity directly from storage and return it through author-visible service paths
  - submission list/get controller paths appear to rely on direct storage access without a strong role gate in the controller layer

Relevant `ai-service` observations:
- `ai-service/app/core/auth.py` validates the incoming bearer token by calling `GET /api/v1/users/me` on the Go backend.
- `ai-service/app/services/tool_registry.py` already has an `execution_mode` field, but the current runtime in `ai-service/app/services/agent_runtime.py` still treats tool calls as externally completed tool results instead of executing server-side tools inline.
- The recent chatbot work added client-side navigation tools, not backend query tools.

## Relevant Existing Modules

### Backend

- `backend/cmd/server/main.go`
  Route wiring and dependency injection.
- `backend/internal/middleware/auth.go`
  JWT middleware and current admin-token bypass.
- `backend/internal/controller/conference/conference.go`
  Existing conference list/stats/status endpoints.
- `backend/internal/controller/submission/submission.go`
  Existing submission reads and mutations.
- `backend/internal/controller/reviewer/reviewer.go`
  Reviewer dashboard and assignment-related reads.
- `backend/internal/service/discussion/service.go`
  Existing discussion access rules.
- `backend/internal/storage/discussion/discussion.go`
  Existing discussion joins and reviewer identity exposure.
- `backend/internal/storage/conference/conference.go`
  Existing conference stats query.
- `backend/internal/storage/submission/submission.go`
  Existing cross-conference submission reads.
- `backend/internal/storage/conference_user_role/conference_user_role.go`
  Role lookup storage that should inform engine policy decisions.

### AI Service

- `ai-service/app/api/routes.py`
  Main agent HTTP API surface and bearer-token handling.
- `ai-service/app/core/auth.py`
  Current identity derivation against backend `/users/me`.
- `ai-service/app/services/tool_registry.py`
  Tool registry structure.
- `ai-service/app/services/agent_runtime.py`
  Runtime orchestration and current tool execution semantics.

## Constraints

- The backend query engine must be read-only in phase 1.
- Existing backend domain models should not be changed for the feature.
- The agent gets one backend query tool, not a tool per workflow.
- The backend must enforce current-user scoping; `ai-service` must not become the authorization source of truth.
- Discussion threads and discussion messages are out of scope for phase 1.
- The feature should be flexible enough for ad hoc summaries and reports, not just fixed report endpoints.

## Risks and Unknowns

- The current backend surface already contains privacy-risky reads, so the engine cannot safely reuse existing response DTOs.
- A generic query layer can become an accidental public power API if it is protected only by user JWT and not additionally restricted to `ai-service`.
- `ai-service` still needs a server-side tool execution path; otherwise a backend query tool would be awkwardly modeled as a client-completed tool.
- Submission, assignment, and review visibility rules differ by actor role and conference stage. The resource registry needs explicit row-level access modes and field-level redaction rules.
- Review-body and discussion visibility rules are the most sensitive part of the policy model and should stay deferred until the engine contract is proven on simpler resources.

## Initial Solution Direction

Build a general backend query engine with:
- one backend endpoint that accepts a constrained JSON DSL
- one `ai-service` server-side tool that calls that endpoint
- resource-oriented, policy-scoped views instead of workflow endpoints
- a `describe` operation that returns resource metadata safe for the agent to inspect
- a `query` operation that supports controlled filtering, selection, grouping, aggregates, sorting, and limits
- mandatory backend-injected actor scoping and field redaction

Phase 1 should target:
- `conferences`
- `public_conferences`
- `submissions`
- `assignments`
- `conference_stats`
- `notifications`

and explicitly defer:
- `discussion_threads`
- `discussion_messages`
- raw review bodies and reviewer-identity-sensitive views
