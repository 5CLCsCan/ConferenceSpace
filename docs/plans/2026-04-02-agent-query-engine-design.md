# Agent Query Engine Design

**Date:** 2026-04-02

**Goal**

Add a general-purpose, agent-safe query engine to the Go backend so the `ai-service` can expose a single backend query tool that lets the model inspect and query policy-scoped platform data without gaining arbitrary SQL access or bypassing user visibility rules.

## Goals

- Keep the query engine in the backend, where the data model and auth boundary already live.
- Expose one agent tool in `ai-service`, not a patchwork of workflow-specific tools.
- Make the engine flexible within strict boundaries: resource selection, filters, aggregates, sorting, grouping, and result shaping through a constrained DSL.
- Force all actor scoping and redaction decisions through backend policy logic.
- Keep phase 1 read-only and avoid changes to existing backend domain models.

## Non-Goals

- Arbitrary SQL or caller-defined joins.
- Reusing existing controller responses as the engine contract.
- Solving discussion-thread visibility in phase 1.
- Exposing blind-review-sensitive review bodies or reviewer identities in phase 1.
- Turning the engine into a general public analytics API for frontend clients.

## Actors and Workflows

### Author workflow

The author asks the agent for the current state of a submission in conference X. The agent:
1. calls `query_backend` with `op=describe` if it needs the contract
2. issues a `query` against the `submissions` resource
3. receives only submissions the current user can legitimately access
4. summarizes the result in natural language

### Chair workflow

The chair asks for a report across all chaired conferences. The agent:
1. inspects `conferences`, `conference_stats`, and optionally `assignments`
2. issues grouped and aggregated queries
3. receives only data for conferences where the current user is chair or co-chair
4. synthesizes a summary without the backend needing a dedicated “chair report” endpoint

### Reviewer workflow

Reviewer workload and assignment summaries are supported by the same engine shape, but reviewer-specific resource breadth should stay smaller than chair scope in phase 1.

## Core Entities

The query engine contract is built around policy-scoped resources, not raw tables and not story-specific endpoints.

### Phase-1 resources

- `conferences`
- `public_conferences`
- `submissions`
- `assignments`
- `conference_stats`
- `notifications`

These are logical views:
- `submissions` is not the raw `conference_submissions` table
- `conferences` is not “all conferences”
- `public_conferences` is the public discovery surface for non-draft conferences
- `assignments` is not “all paper assignments”

Each resource spec defines:
- base SQL shape
- allowed fields
- allowed filter operators per field
- allowed sort keys
- allowed aggregates
- row-level access predicates
- field-level redaction behavior
- response projection

## Module Boundaries

### Backend

Use a dedicated backend subsystem instead of wrapping existing handlers.

Recommended package shape:
- `backend/internal/agentquery/contract`
  Request and response DTOs for the engine DSL.
- `backend/internal/agentquery/policy`
  Actor resolution helpers, role lookups, row-scope rules, and field redaction rules.
- `backend/internal/agentquery/resources`
  Registered resource specs for `conferences`, `public_conferences`, `submissions`, `assignments`, `conference_stats`, and `notifications`.
- `backend/internal/agentquery/engine`
  Request validation, resource dispatch, query execution, and result shaping.
- `backend/internal/controller/agentquery/agentquery.go`
  One controller surface that binds the HTTP endpoint to the engine.

This concentrates the complexity in one deep module instead of scattering it across existing entity controllers.

### AI Service

`ai-service` keeps one agent tool:
- `query_backend`

That tool supports:
- `describe`
- `query`

`ai-service` responsibilities:
- validate the user bearer token as it already does
- execute the server-side tool
- forward the user bearer token plus an internal service credential to the backend
- return backend results as tool output

`ai-service` must add a real server-side tool execution path. The current runtime advertises tools, emits tool calls, and waits for external tool results; that is not enough for this feature.

## Data and Storage

### No domain model changes

Phase 1 should not change the existing backend data model or migrate core domain tables.

### Read strategy

The engine should use dedicated read-only SQL builders over the existing tables instead of reusing current storage DTOs. That is important because the public REST storage layer is not uniformly safe enough to serve as the agent contract.

### Access model

All query execution is row-scoped by actor context:
- authors see their own authored submissions and related notifications
- authenticated users can query public discovery data for non-draft conferences through `public_conferences`
- chairs/co-chairs see data for conferences they govern
- reviewers see their own assignments and reviewer-facing notifications

If a row can be reached through multiple access modes, the engine should compute the strongest applicable visibility for that row before projection.

### Redaction model

Field redaction is part of resource projection, not an afterthought.

Examples:
- author-visible `submissions` should not expose reviewer identity fields in phase 1
- `conference_stats` can return counts and grouped summaries without leaking per-user details
- `assignments` for reviewers can show their own workload fields but not unrelated reviewer assignments

## API Contracts

### AI-service tool

One tool:

```json
{
  "name": "query_backend"
}
```

### Tool operations

#### `describe`

Used by the agent to discover the queryable contract.

Example:

```json
{
  "op": "describe",
  "resource": "submissions"
}
```

Response shape:
- resource description
- selectable fields
- filterable fields and operators
- sortable fields
- supported aggregates
- grouping support
- result examples
- policy notes

The describe output must not leak raw table names, hidden columns, or inaccessible internal fields.

#### `query`

Used by the agent to execute a constrained query.

Example:

```json
{
  "op": "query",
  "resource": "submissions",
  "select": [
    { "field": "id" },
    { "field": "title" },
    { "field": "status" },
    { "field": "updated_at" },
    { "field": "conference.acronym", "as": "conference_acronym" }
  ],
  "filter": {
    "and": [
      { "field": "conference.acronym", "op": "eq", "value": "ICML2026" }
    ]
  },
  "sort": [
    { "field": "updated_at", "dir": "desc" }
  ],
  "limit": 10
}
```

### DSL boundaries

Allowed top-level query controls:
- `resource`
- `select`
- `filter`
- `group_by`
- `aggregates`
- `sort`
- `limit`
- `offset`

Allowed filter composition:
- `and`
- `or`
- `not`
- leaf predicates with explicit `field`, `op`, `value`

Typical operators:
- `eq`
- `neq`
- `in`
- `contains`
- `prefix`
- `gte`
- `lte`
- `is_null`

Intentional prohibitions:
- arbitrary SQL
- arbitrary joins
- computed expressions from the caller
- caller-defined functions
- caller-supplied identity or role context

### Backend endpoint

Use one backend endpoint, for example:
- `POST /api/v1/agent/query`

Request authentication should require:
- end-user `Authorization: Bearer <jwt>`
- internal `X-Agent-Service-Token: <shared-secret>`

Do not reuse `X-Admin-Token` for this feature. That bypass is too broad.

### Query response

Recommended response shape:

```json
{
  "resource": "submissions",
  "rows": [
    {
      "id": 42,
      "title": "Paper Title",
      "status": "reviewing",
      "updated_at": "2026-04-02T10:00:00Z",
      "conference_acronym": "ICML2026"
    }
  ],
  "aggregates": {},
  "page": {
    "limit": 10,
    "offset": 0,
    "returned": 1,
    "truncated": false
  },
  "policy": {
    "actor_user_id": 123,
    "actor_roles_considered": ["author"],
    "redactions_applied": []
  }
}
```

The `policy` metadata is for inspectability and debugging, not for revealing hidden access paths.

## Lifecycle and Failure Modes

### Describe flow

1. `ai-service` receives a tool call with `op=describe`
2. server-side tool executor calls backend endpoint
3. backend validates service token and user JWT
4. engine returns resource metadata or a validation failure

### Query flow

1. `ai-service` receives a tool call with `op=query`
2. server-side tool executor forwards the request to backend
3. backend validates auth and payload shape
4. engine resolves the resource spec
5. policy layer injects actor scope predicates
6. engine validates all fields, operators, sorts, and aggregates against the resource spec
7. engine executes read-only SQL
8. projection/redaction layer shapes the rows
9. backend returns structured result

### Failure behavior

The engine must fail hard and clearly for:
- unknown resource
- unknown field
- unsupported operator
- unsupported aggregate
- invalid sort key
- query shape too large
- limit above maximum
- unauthorized resource access
- missing or invalid service token
- invalid or expired user token

No silent fallbacks to broader visibility, weaker filters, or raw existing endpoints.

## Migration and Rollout

### Phase 1

- add backend engine module and one endpoint
- add `query_backend` server tool in `ai-service`
- support `describe`
- support `query`
- ship resource specs for `conferences`, `public_conferences`, `submissions`, `assignments`, `conference_stats`, and `notifications`
- add logs and test coverage

### Phase 2

After the engine contract is proven:
- review-body exposure policy
- discussion thread/message resources
- richer pagination or cursor behavior if needed
- additional aggregates and aliases if agent quality requires them

## Testing and Observability

### Backend tests

- DSL validation unit tests
- resource-spec validation tests
- policy tests for author, chair, co-chair, reviewer, and unrelated user cases
- API tests verifying denied access and redacted outputs
- regression tests for known privacy hazards

### AI-service tests

- tool schema tests for `query_backend`
- runtime tests covering server-side tool execution
- request forwarding tests ensuring both bearer token and service token are included
- error propagation tests

### Observability

Log at minimum:
- resource name
- op type
- actor user id
- execution time
- row count
- redaction count
- rejection reason

Do not log full result payloads or sensitive raw filter values by default.
