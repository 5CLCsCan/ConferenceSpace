## Problem Statement

ConferenceSpace has an agent runtime, but it does not yet have a safe backend querying capability that lets the agent answer user-specific status and reporting questions from live conference data.

Today, the backend owns the data model and authorization rules, while the `ai-service` owns tool orchestration. Without a dedicated backend query engine, the agent is forced toward weak options:
- fixed workflow endpoints that reduce the agent to a worksheet
- reuse of existing API responses that are not designed as agent-safe data contracts
- future pressure toward arbitrary SQL or fragile query rewriting

The product problem is not “how do we expose a report endpoint.” The problem is “how do we let the agent inspect and summarize live conference data flexibly, while ensuring it never escapes the current user’s visibility boundary.”

## Solution

Build a read-only backend query engine with a constrained JSON DSL and expose it to the agent through a single `ai-service` tool.

The tool will support:
- `describe` so the agent can inspect the policy-safe query contract
- `query` so the agent can request specific resource slices, aggregates, and groupings

The backend will:
- derive the actor from the forwarded user bearer token
- enforce row-level scope and field-level redaction
- execute only registered resource specs with approved fields, filters, sorts, and aggregates
- return structured results suitable for summarization by the agent

Phase 1 is intentionally narrow and excludes discussions and raw review-body access.

## User Stories

1. As an author, I want to ask the conference agent for the status of my submission in conference X so that I do not need to manually navigate multiple pages.
2. As an author, I want the agent to summarize the latest state of my submission using only information I am allowed to see so that blind-review boundaries are preserved.
3. As an author, I want the agent to fail clearly when it cannot find a submission tied to me so that it does not hallucinate a status.
4. As a chair, I want to ask for a report across all conferences I chair or co-chair so that I can quickly understand submission counts, assignment progress, and overall conference state.
5. As a chair, I want the agent to compare multiple chaired conferences in one answer so that I can prioritize where attention is needed.
6. As a chair, I want the agent to aggregate data such as counts by status without needing a custom report endpoint per question.
7. As a reviewer, I want the agent to summarize my current assignment workload so that I can see what is pending without manually checking each conference.
8. As a user, I want the agent to inspect which resources and fields are available before querying so that it can adapt its query payload instead of guessing.
9. As a user, I want the agent to receive policy-safe metadata about the query surface, not raw backend internals, so that discovery does not leak hidden fields.
10. As a platform owner, I want one user to be unable to query another user’s data through the agent so that the query engine does not become a privacy hole.
11. As a platform owner, I want the backend, not the model, to decide who can see each row and field so that authorization remains deterministic and inspectable.
12. As a platform owner, I want blind-review-sensitive resources to be withheld until their masking rules are explicit so that phase 1 does not ship unsafe data access.
13. As an operator, I want query failures to be structured and explainable so that the model can correct its request instead of falling back to unsafe heuristics.
14. As an operator, I want the query endpoint restricted to agent-service callers so that it does not quietly become a general public analytics API.
15. As an operator, I want query execution to be logged with actor, resource, duration, and rejection reason so that suspicious or broken behavior can be diagnosed.
16. As a developer, I want the engine to work against registered resources rather than story-specific report endpoints so that new agent use cases can be unlocked without proliferating one-off APIs.
17. As a developer, I want the engine to avoid raw SQL passthrough so that query flexibility does not come at the cost of unsafe parser and rewriting logic.
18. As a developer, I want phase 1 to avoid backend schema changes so that the feature can ship on top of the current data model.

## Implementation Decisions

- The Go backend will host the query engine.
- `ai-service` will expose one server-side tool, tentatively `query_backend`.
- The tool will support `describe` and `query`.
- The backend contract is resource-oriented, not workflow-oriented.
- Each resource is a policy-scoped view with a fixed registry of fields, operators, sorts, aggregates, and projection rules.
- The backend will derive actor identity from the forwarded bearer token and should additionally require a dedicated internal service token.
- Existing public DTOs and controller responses will not be used as the engine contract.
- Phase 1 resources are `conferences`, `public_conferences`, `submissions`, `assignments`, `conference_stats`, and `notifications`.
- Discussion resources and raw review-body access are deferred.
- `ai-service` must add a true server-side tool execution path instead of relying on client-completed tool results.

## Testing Decisions

- Good tests assert externally visible access behavior, not internal SQL implementation details.
- Backend tests should cover authorization, redaction, allowed query shapes, and rejection paths for unrelated users.
- Backend tests should include regression cases for privacy-sensitive existing surfaces, especially discussion- and submission-related leakage patterns that the new engine must avoid.
- `ai-service` tests should cover tool registration, server-side execution, auth/header forwarding, and structured error handling.
- End-to-end tests should prove that a user can query only their own scoped data through the agent tool.

## Out of Scope

- Arbitrary SQL authored by the model
- Public frontend access to the query engine endpoint
- Discussion thread and discussion message querying in phase 1
- Raw review bodies and reviewer-identity-sensitive review surfaces in phase 1
- Write or mutation operations
- Generic business intelligence exports

## Further Notes

- The current codebase already shows privacy-risky read paths in discussion and submission handling. The query engine must be treated as a fresh contract, not as a convenience wrapper.
- The describe/query split is important because it lets the agent learn the safe contract dynamically without leaking internal schema details.
