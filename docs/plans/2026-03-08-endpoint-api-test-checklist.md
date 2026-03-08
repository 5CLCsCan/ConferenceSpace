# API Endpoint Test Checklist (Run-Against-Live-Backend)

## Goal
Run integration tests against a started backend instance and cover:
- Route wiring and auth guards for all registered API routes.
- Core endpoint behavior for profile sync, reviewer detail/delete, submission precheck/file/review endpoints, and notification preferences.

## Prerequisites
- Backend server is running (default: `http://localhost:8080`).
- Database is up and migrated.
- Optional services (Semantic Scholar/Neo4j) can be disabled; tests handle optional route availability where needed.

## One-Command Run (All API Tests)
From repo root:

```bash
cd backend
TEST_SERVER_HOST=localhost TEST_SERVER_PORT=8080 GOCACHE=/tmp/go-build go test -v ./tests/api/...
```

Equivalent Make target:

```bash
cd backend
make test-api
```

## Fast Compile Check (No Endpoint Execution)
Use this to check compile errors in the API test packages:

```bash
cd backend
GOCACHE=/tmp/go-build go test ./tests/api/... -run TestDoesNotExist
```

## Coverage Checklist By Area
- [ ] `smoke`: all registered routes are reachable and correctly guarded (public vs protected).
- [ ] `auth`: test login (dev/test route) works when enabled.
- [ ] `user`: profile sync status/search/link/unlink endpoint validations and lifecycle behavior.
- [ ] `reviewer`: get-by-id and delete reviewer invitation endpoints.
- [ ] `submission`: precheck validation path, file download path, review list/analytics path.
- [ ] `notification`: preferences get/update and get-by-id validations.

## Notes
- If `auth/test-login` is not enabled in the running environment, that test auto-skips.
- If Semantic Scholar routes are not enabled, smoke tests allow `404` for those optional routes.
