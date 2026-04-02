# Agent Query Engine Implementation Spec

## Summary

Implement a read-only backend query engine plus a single `ai-service` server-side tool that lets the agent inspect and query policy-scoped data through a constrained JSON DSL. Phase 1 supports `conferences`, `public_conferences`, `submissions`, `assignments`, `conference_stats`, and `notifications`, and explicitly defers discussion resources and raw review-body exposure.

## Final Module Responsibilities

### Backend

- `internal/controller/agentquery`
  Accept the HTTP request, validate transport-level auth requirements, and delegate to the engine.
- `internal/agentquery/contract`
  Define request and response schemas for `describe` and `query`.
- `internal/agentquery/engine`
  Validate DSL payloads, dispatch to resource specs, execute read-only queries, and shape the response.
- `internal/agentquery/policy`
  Resolve actor context, evaluate access modes, and apply field redaction.
- `internal/agentquery/resources`
  Register resource specs and define per-resource field registries, filter rules, sort rules, and aggregate support.

### AI Service

- `app/services/tool_registry.py`
  Register `query_backend` as a server-side tool.
- `app/services/agent_runtime.py`
  Execute server-side tools inline instead of treating them as client-completed tool calls.
- new backend query client module
  Build the outbound request to the Go backend, forward user bearer token and service credential, and normalize the response for tool output.

## Data Model and Schema Changes

- No phase-1 changes to the existing backend domain schema.
- No new backend domain models are required.
- Existing `ai-service` tool audit storage can continue to record tool requests and completions.
- Backend traceability in phase 1 should use structured application logs rather than new audit tables.

## API and Event Contracts

### AI-service tool contract

Tool name:
- `query_backend`

Tool input:
- `op: "describe" | "query"`
- `resource?: string`
- query payload fields for `query`

### Backend HTTP contract

Recommended endpoint:
- `POST /api/v1/agent/query`

Required headers:
- `Authorization: Bearer <end-user-jwt>`
- `X-Agent-Service-Token: <shared-secret>`

### Backend query request

Supported top-level query members:
- `resource`
- `select`
- `filter`
- `group_by`
- `aggregates`
- `sort`
- `limit`
- `offset`

### Backend query response

- `resource`
- `rows`
- `aggregates`
- `page`
- `policy`

### Describe response

- resource metadata
- allowed fields and operators
- allowed aggregates
- sortability
- examples
- policy notes

## Execution Flow

1. User message reaches `ai-service`.
2. The runtime calls `query_backend`.
3. `ai-service` validates the user bearer token as it does today.
4. The server-side tool executor calls the Go backend query endpoint.
5. The Go backend validates:
   - the internal service credential
   - the forwarded user JWT
   - the DSL request shape
6. The backend resolves the requested resource spec.
7. The policy layer injects actor-scoped filters and determines redaction behavior.
8. The resource spec executes read-only SQL.
9. The result projector emits only the allowed fields.
10. `ai-service` returns the backend response as tool output to the runtime.

## Migration Notes

- Add the backend endpoint without changing existing REST handlers.
- Add the `ai-service` server-side tool execution path behind the new tool only; do not refactor the client tool flow more than necessary.
- Keep the phase-1 resource set narrow.
- Document the internal service token in backend and `ai-service` environment configuration.
- Do not reuse the current admin token bypass for agent query traffic.

## Testing Strategy

### Backend

- unit tests for DSL validation
- unit tests for resource registry validation
- unit tests for policy decisions by actor role
- API tests for:
  - author access to own submissions
  - chair access to chaired conference stats
  - reviewer access to own assignments
  - unrelated user denial
  - invalid resource rejection
  - invalid field/operator rejection
  - redacted output behavior

### AI Service

- tool registry tests
- runtime tests for server-side tool execution
- backend client tests for header forwarding and error normalization
- integration tests for `describe` and `query` tool flows

## Risks

- The current backend surface contains reads that should not be treated as trusted projections.
- Adding a powerful query endpoint without a separate service credential would make accidental direct use too easy.
- Server-side tool execution changes runtime behavior in `ai-service`; keep that change narrowly scoped.
- Submission and assignment visibility is multi-role and multi-conference; resource specs must be explicit, not inferred from existing handlers.

## Explicit Deferrals

- discussion thread and message resources
- raw review bodies
- reviewer identity exposure to authors
- generalized export/report templates
- write operations or mutating tools
- backend schema migrations for query-specific audit storage
