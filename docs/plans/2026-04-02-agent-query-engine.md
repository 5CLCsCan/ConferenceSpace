# Agent Query Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a read-only backend query engine plus a single `ai-service` server-side tool so the agent can describe and query policy-scoped conference data without arbitrary SQL access or authorization bypasses.

**Architecture:** Keep query execution and authorization in the Go backend, where the relational model and JWT trust boundary already live. Add a dedicated agent-query subsystem with a constrained DSL and a resource registry, then add one `ai-service` server-side tool that forwards the current user bearer token plus an internal service credential to the backend query endpoint.

**Tech Stack:** Go 1.24, Gin, PostgreSQL, Python 3.12, FastAPI, httpx, pytest, Go unit tests, backend API tests

---

### Task 1: Lock the `ai-service` server-side tool execution path in tests

**Files:**
- Modify: `ai-service/tests/test_agent_runtime_helpers.py`
- Modify: `ai-service/tests/test_api_schemas.py`
- Inspect: `ai-service/app/services/agent_runtime.py`
- Inspect: `ai-service/app/services/tool_registry.py`

**Step 1: Write the failing test**

Add tests that prove:
- a tool with `execution_mode="server"` is executed by the runtime without waiting for a client-side tool result
- the runtime surfaces structured tool output or tool failure correctly
- the new tool schema for `query_backend` is registered with `op` required and `describe/query` allowed

**Step 2: Run test to verify it fails**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_agent_runtime_helpers.py tests/test_api_schemas.py -q`

Expected: FAIL because the runtime currently treats all tools as externally completed tool results and the `query_backend` tool is not registered.

**Step 3: Write minimal implementation**

Update the runtime so it:
- checks the tool spec execution mode
- executes server-side tools inline for `query_backend`
- keeps the existing client-tool behavior unchanged

Register `query_backend` in `tool_registry.py`.

**Step 4: Run test to verify it passes**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_agent_runtime_helpers.py tests/test_api_schemas.py -q`

Expected: PASS

### Task 2: Add an `ai-service` backend query client

**Files:**
- Create: `ai-service/app/services/backend_query_client.py`
- Create: `ai-service/tests/test_backend_query_client.py`
- Modify: `ai-service/app/core/config.py`
- Inspect: `ai-service/app/core/auth.py`

**Step 1: Write the failing test**

Add tests that prove:
- the backend query client forwards the current bearer token in `Authorization`
- the backend query client forwards `X-Agent-Service-Token`
- `describe` and `query` payloads are sent unchanged
- 4xx and 5xx backend failures are normalized into structured tool errors

**Step 2: Run test to verify it fails**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_backend_query_client.py -q`

Expected: FAIL because the backend query client does not exist yet.

**Step 3: Write minimal implementation**

Create `backend_query_client.py` and config entries for:
- backend query endpoint base URL if separate from `BACKEND_API_BASE_URL`
- `AGENT_BACKEND_SERVICE_TOKEN`

Keep the client narrow: one method for the query engine call.

**Step 4: Run test to verify it passes**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_backend_query_client.py -q`

Expected: PASS

### Task 3: Lock the backend query DSL contract with unit tests

**Files:**
- Create: `backend/internal/agentquery/contract/contract.go`
- Create: `backend/internal/agentquery/contract/contract_test.go`

**Step 1: Write the failing test**

Add tests that prove:
- `describe` and `query` requests bind correctly
- invalid `op` values are rejected
- invalid empty resources are rejected for `query`
- invalid operators, oversized limits, and empty `select` lists fail validation

**Step 2: Run test to verify it fails**

Run: `go test ./internal/agentquery/contract -count=1`

Expected: FAIL because the package and validation logic do not exist yet.

**Step 3: Write minimal implementation**

Create the contract types and validation helpers for:
- `describe`
- `query`
- `select`
- `filter`
- `aggregates`
- `sort`
- paging limits

Keep validation explicit and deterministic.

**Step 4: Run test to verify it passes**

Run: `go test ./internal/agentquery/contract -count=1`

Expected: PASS

### Task 4: Add backend resource registry and describe output

**Files:**
- Create: `backend/internal/agentquery/resources/registry.go`
- Create: `backend/internal/agentquery/resources/registry_test.go`
- Create: `backend/internal/agentquery/policy/types.go`
- Create: `backend/internal/agentquery/engine/describe.go`

**Step 1: Write the failing test**

Add tests that prove:
- phase-1 resources are registered exactly as approved
- `describe` for `submissions` returns only policy-safe field metadata
- discussion resources are absent
- hidden or unavailable fields are not exposed as selectable/filterable

**Step 2: Run test to verify it fails**

Run: `go test ./internal/agentquery/resources ./internal/agentquery/engine -count=1`

Expected: FAIL because the registry and describe path do not exist yet.

**Step 3: Write minimal implementation**

Create:
- a resource spec interface
- a registry for `conferences`, `public_conferences`, `submissions`, `assignments`, `conference_stats`, and `notifications`
- a `describe` execution path that returns field/operator/aggregate metadata

Do not build query execution yet.

**Step 4: Run test to verify it passes**

Run: `go test ./internal/agentquery/resources ./internal/agentquery/engine -count=1`

Expected: PASS

### Task 5: Add backend policy resolution tests before query execution

**Files:**
- Create: `backend/internal/agentquery/policy/policy.go`
- Create: `backend/internal/agentquery/policy/policy_test.go`
- Inspect: `backend/internal/storage/conference_user_role/conference_user_role.go`
- Inspect: `backend/internal/middleware/auth.go`

**Step 1: Write the failing test**

Add tests that prove:
- authors can scope into only their own submissions
- chairs/co-chairs can scope into only their conferences
- reviewers can scope into only their own assignments
- unrelated users get no visible rows
- policy metadata records the relevant actor role modes

**Step 2: Run test to verify it fails**

Run: `go test ./internal/agentquery/policy -count=1`

Expected: FAIL because the policy resolver does not exist yet.

**Step 3: Write minimal implementation**

Create policy helpers that:
- resolve actor context from request-scoped auth values
- look up active conference roles
- provide row-scope builders per resource
- expose redaction decisions for later projection

**Step 4: Run test to verify it passes**

Run: `go test ./internal/agentquery/policy -count=1`

Expected: PASS

### Task 6: Implement phase-1 backend query execution resource by resource

**Files:**
- Create: `backend/internal/agentquery/engine/query.go`
- Create: `backend/internal/agentquery/resources/conferences.go`
- Create: `backend/internal/agentquery/resources/submissions.go`
- Create: `backend/internal/agentquery/resources/assignments.go`
- Create: `backend/internal/agentquery/resources/conference_stats.go`
- Create: `backend/internal/agentquery/resources/notifications.go`
- Create: `backend/internal/agentquery/engine/query_test.go`

**Step 1: Write the failing test**

Add tests that prove:
- supported fields, filters, sorts, and aggregates work for each phase-1 resource
- unsupported fields/operators are rejected before SQL execution
- max limit is enforced
- returned rows contain only allowed projection fields
- aggregate queries work for chair report scenarios

**Step 2: Run test to verify it fails**

Run: `go test ./internal/agentquery/engine ./internal/agentquery/resources -count=1`

Expected: FAIL because query execution is not implemented yet.

**Step 3: Write minimal implementation**

Implement the query execution path:
- resolve the resource spec
- validate the caller DSL against the spec
- apply policy scope predicates
- execute read-only SQL
- return projected rows and aggregates

Do not reuse existing public DTOs as output projections.

**Step 4: Run test to verify it passes**

Run: `go test ./internal/agentquery/engine ./internal/agentquery/resources -count=1`

Expected: PASS

### Task 7: Add the backend HTTP endpoint and API tests

**Files:**
- Create: `backend/internal/controller/agentquery/agentquery.go`
- Modify: `backend/internal/controller/controller.go`
- Modify: `backend/cmd/server/main.go`
- Create: `backend/tests/api/agentquery/agentquery_test.go`
- Create: `backend/tests/api/agentquery/client.go`

**Step 1: Write the failing test**

Add API tests that prove:
- missing bearer token returns 401
- missing or invalid service token returns 403
- `describe` works for authenticated agent-service callers
- authors cannot query another author’s submission
- chairs can query conference stats for chaired conferences only
- discussion resources are rejected

**Step 2: Run test to verify it fails**

Run: `go test ./tests/api/agentquery -count=1`

Expected: FAIL because the endpoint and routing do not exist yet.

**Step 3: Write minimal implementation**

Add:
- the controller
- route registration in `main.go`
- config wiring for the service token
- the transport-level service-token check

Reuse existing JWT auth for the actor identity. Do not use the admin token bypass.

**Step 4: Run test to verify it passes**

Run: `go test ./tests/api/agentquery -count=1`

Expected: PASS

### Task 8: Wire the `query_backend` tool through `ai-service`

**Files:**
- Modify: `ai-service/app/services/agent_runtime.py`
- Modify: `ai-service/app/services/tool_registry.py`
- Modify: `ai-service/app/api/routes.py` only if dependency wiring needs it
- Modify: `ai-service/tests/test_agent_runtime_helpers.py`
- Modify: `ai-service/tests/test_api_schemas.py`

**Step 1: Write the failing test**

Add tests that prove:
- `query_backend` `describe` tool calls return backend describe results to the model
- `query_backend` `query` tool calls return backend query results to the model
- backend errors become structured tool errors instead of crashing the runtime

**Step 2: Run test to verify it fails**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_agent_runtime_helpers.py tests/test_api_schemas.py tests/test_backend_query_client.py -q`

Expected: FAIL until the runtime actually wires the new client and server-side tool behavior together.

**Step 3: Write minimal implementation**

Wire `query_backend` into the runtime’s server-tool path and keep the existing client-tool flow unchanged.

**Step 4: Run test to verify it passes**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_agent_runtime_helpers.py tests/test_api_schemas.py tests/test_backend_query_client.py -q`

Expected: PASS

### Task 9: Run focused end-to-end verification and review the diff

**Files:**
- Modify: only files above as needed for cleanup

**Step 1: Run backend focused verification**

Run: `go test ./internal/agentquery/... ./tests/api/agentquery -count=1`

Expected: PASS

**Step 2: Run ai-service focused verification**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_agent_runtime_helpers.py tests/test_api_schemas.py tests/test_backend_query_client.py -q`

Expected: PASS

**Step 3: Review the diff**

Run: `git diff -- backend/cmd/server/main.go backend/internal/controller/controller.go backend/internal/controller/agentquery backend/internal/agentquery ai-service/app/core/config.py ai-service/app/services/tool_registry.py ai-service/app/services/agent_runtime.py ai-service/app/services/backend_query_client.py ai-service/tests/test_agent_runtime_helpers.py ai-service/tests/test_api_schemas.py ai-service/tests/test_backend_query_client.py backend/tests/api/agentquery docs/plans/2026-04-02-agent-query-engine-design.md docs/plans/2026-04-02-agent-query-engine-prd.md docs/plans/2026-04-02-agent-query-engine-implementation-spec.md docs/plans/2026-04-02-agent-query-engine.md`

Expected: only the new query engine, its `ai-service` integration, and the planning documents above.
