# Agent Query Engine Decision Log

- Date: 2026-04-02
- Topic: Agent-safe backend query engine
- Owner: Codex planning session

## Decisions

### D-001
- Question: Where should the agent query engine live?
- Decision: The query engine will live in the Go backend. `ai-service` will expose a single agent tool that delegates to it.
- Why: The backend already owns the relational model, the JWT trust boundary, and the role-specific visibility rules. Putting query execution anywhere else weakens security and duplicates authorization logic.
- Alternatives Rejected: Direct database access from `ai-service`; exposing multiple workflow-specific tools; client-side query tooling.
- Follow-up: `ai-service` needs a true server-side tool execution path for this feature.

### D-002
- Question: Should the agent be allowed to write arbitrary SQL?
- Decision: No. The engine will accept a constrained JSON DSL, not SQL.
- Why: SQL passthrough plus query rewriting is brittle and unsafe. One missed predicate, selected column, or join path turns into a privacy bug.
- Alternatives Rejected: Raw SQL passthrough; templated SQL snippets with model-authored fragments.
- Follow-up: Define a resource registry with fixed fields, operators, sort keys, and aggregate capabilities.

### D-003
- Question: How many tools should the agent receive for backend querying?
- Decision: One tool only, tentatively `query_backend`, with two operations: `describe` and `query`.
- Why: One tool keeps the capability surface coherent while still letting the model inspect the allowed query contract before issuing a query.
- Alternatives Rejected: Separate `models_map` and `query` tools; one tool per workflow; one tool per resource.
- Follow-up: The `describe` output must expose only policy-safe metadata, not raw database internals.

### D-004
- Question: Should the engine be organized around user stories or around data resources?
- Decision: It will be resource-oriented, with policy-scoped resources such as `conferences`, `public_conferences`, `submissions`, `assignments`, `conference_stats`, and `notifications`.
- Why: Workflow endpoints collapse the agent into a fixed worksheet. Resource-oriented views preserve flexibility while still enforcing strict boundaries.
- Alternatives Rejected: Story-specific resources such as `my_submission_status` and `my_chair_report`.
- Follow-up: The “my” scope is implicit and enforced by backend policy, not encoded in the tool payload.

### D-005
- Question: How is the current actor determined?
- Decision: The backend will derive actor identity from the forwarded bearer token. The query payload will never carry user identity fields.
- Why: Caller-supplied identity is not trustworthy. The backend must remain the single source of truth for actor scope.
- Alternatives Rejected: `user_id` in request body; `user_email` in request body; policy decisions made in `ai-service`.
- Follow-up: The backend endpoint should also require a dedicated internal service token so it is not a general-purpose client API.

### D-006
- Question: Should the engine reuse existing public DTOs and handler outputs?
- Decision: No. The engine will define dedicated policy-scoped projections for agent queries.
- Why: Existing read paths already show leakage risk. Discussion reads currently carry reviewer identity into author-visible payloads, and some submission reads appear insufficiently role-scoped.
- Alternatives Rejected: Reusing controller responses as-is; wrapping existing handlers.
- Follow-up: Resource specs must own their own field registry and output projection.

### D-007
- Question: What is the phase-1 scope?
- Decision: Phase 1 excludes `discussion_threads` and `discussion_messages`, and should also avoid raw review-body exposure until blind-review policy is formalized for the engine.
- Why: Discussion visibility is already known to be risky, and review content raises the same identity-masking issues. Shipping those early would put the hardest privacy boundary on the critical path.
- Alternatives Rejected: Including discussions in the initial rollout.
- Follow-up: Phase 1 focuses on actor-scoped conference resources plus `public_conferences`, submissions, assignments, conference statistics, and notifications.

### D-008
- Question: Are backend schema or model changes allowed for this feature?
- Decision: No changes to existing domain models are required for phase 1. The engine will be implemented as a read-only subsystem over existing tables.
- Why: The request explicitly asked to avoid backend model changes, and phase 1 can be satisfied with read projections plus policy logic.
- Alternatives Rejected: Adding generic query tables; altering domain models to fit the engine.
- Follow-up: Use application logs and existing `ai-service` tool audit storage for traceability instead of adding backend audit tables in phase 1.

### D-009
- Question: How should `ai-service` integrate with the new backend engine?
- Decision: `ai-service` will add one server-side tool and forward the end-user bearer token plus a dedicated internal service credential to the backend query endpoint.
- Why: The current runtime already validates user tokens against the backend. Forwarding the same actor token preserves backend authorization, while the service credential prevents accidental public exposure of the agent-only endpoint.
- Alternatives Rejected: Backend endpoint protected by user JWT alone; backend endpoint protected by admin token; `ai-service` running its own access-control logic.
- Follow-up: Document the new config keys and execution path explicitly in the implementation plan.
