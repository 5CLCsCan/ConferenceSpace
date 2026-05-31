# Backend Service Benchmarking Suite — Design

**Date:** 2026-05-31
**Status:** Approved (pending spec review)

## 1. Goal & Scope

Build a reusable, environment-agnostic benchmark suite for the ConferenceSpace
backend that produces raw CSV/JSON performance data for a written performance
report. The suite has two complementary measurement layers:

- **k6 HTTP load tests (black-box):** drive real REST endpoints under concurrent
  load and capture end-to-end latency (p50/p90/p95/p99), throughput (req/s), and
  error rate — the numbers users actually experience.
- **Go micro-benchmarks (white-box):** exercise the reviewer-matching algorithm
  and the COI detectors in isolation (no HTTP, no serialization) and capture
  `ns/op`, `allocs/op`, and `B/op` across input sizes — isolating raw algorithm
  cost from stack/DB overhead.

### In scope (benchmark targets)
- **Core CRUD / auth:** login, list conferences, list submissions, list users.
- **Reviewer matching & suggestion:** the auto-assignment / matching algorithm
  and the reviewer-suggestion endpoint.
- **COI detection:** self-author + declared-conflict detectors (CPU-only) and the
  Neo4j graph-based relationship detector.

### Out of scope
- AI-backed / external-dependent endpoints (autofill, precheck, decision copilot,
  Semantic Scholar sync). These depend on external APIs and are nondeterministic,
  so they are excluded from the performance report.

## 2. Approach

Layered design (chosen over HTTP-only and micro-only alternatives):

- k6 measures the heavy paths end-to-end through real endpoints, AND
- Go `testing.B` benchmarks measure the matching and COI algorithm cores directly.

This separates "is the algorithm slow" from "is the stack/serialization/DB slow"
and gives the report two complementary stories.

The suite is environment-agnostic: every component is parameterized by a
`BASE_URL` (and, where relevant, Neo4j connection details), so the exact same
scripts run against a local `docker-compose` stack, a controlled local run, or a
deployed staging environment.

## 3. Repository Layout

```
backend/benchmarks/
  README.md                     # how to run, env vars, interpreting output
  run.sh                        # convenience wrapper: timestamped results dir
  config/
    env.example                 # BASE_URL, auth knobs, Neo4j conn, dataset sizes
  seed/
    main.go                     # HTTP-based seed tool for Postgres app data
    graph.go                    # synthetic co-authorship graph generator (CSV)
  k6/
    lib/
      auth.js                   # auth bootstrap (test-login -> JWT)
      config.js                 # env-var-driven scenario config + helpers
    crud.js                     # login + list conferences/submissions/users
    matching.js                 # auto-assign / reviewer-suggestion endpoint
    coi.js                      # COI-check endpoint
  micro/
    matching_bench_test.go      # AssignmentMatcher over synthetic score matrices
    coi_bench_test.go           # composite detector (self-author + declared)
    coi_graph_bench_test.go     # graph relationship detector (requires Neo4j)
  results/
    .gitkeep                    # committed raw output lands here
```

Micro-benchmarks live under `benchmarks/micro` but import the real
`internal/assignment/...` packages so they measure production code.

## 4. Component: Seed Tool (`seed/`)

Populates a representative dataset before load tests run.

### 4.1 Postgres app data — over HTTP
- Pure HTTP; talks to any reachable backend via `BASE_URL`. No DB credentials
  required for this part.
- Bootstraps auth via the dev `test-login` endpoint, which mints a JWT and
  auto-creates the user (available only when the server runs in `development` or
  `test` env).
- Creates a representative dataset with configurable counts via flags:
  `--conferences`, `--reviewers`, `--submissions`, `--authors`,
  `--declared-conflicts`. Defaults: 1 conference, 200 reviewers, 500 submissions,
  a proportional number of authors and a configurable number of declared
  conflicts.
- Tags created entities with a run prefix so reruns are identifiable.
- Writes a JSON summary (`results/seed-summary.json`) containing the created IDs
  and counts; the k6 scripts read this so they hit real seeded IDs.
- Reuses the request patterns from `backend/tests/api` (notably the
  `testutils`-style client and the `test-login` flow).

### 4.2 Neo4j co-authorship graph — direct to DB
The `RelationshipDetector` reads co-authorship edges from Neo4j, which the HTTP
app-data seed does not create. To make graph-based COI fully measurable:

- `seed/graph.go` generates a synthetic co-authorship dataset (authors +
  `COAUTHORED` edges with `established_date`) as a CSV, sized to align with the
  seeded reviewers/authors.
- The graph is loaded **directly into Neo4j** by reusing the existing
  `scripts/graph_ingestion` bolt loader (a separate Go module), invoked via
  `go run .` with `-file/-uri/-user/-pass/-clear` flags. (Note: the backend
  `Makefile`'s `graph-import` target points at a non-existent
  `tools/graph_ingestion` path and is broken, so the loader is invoked directly
  rather than through `make`.) The loader CSV format is
  `author_1,author_2,date,metadata` where `date` is an integer year.
- This requires Neo4j connection details for the target environment. When Neo4j
  is unavailable, the graph seed is skipped and COI falls back to the basic
  detectors only (documented behavior, not an error).

## 5. Component: k6 HTTP Load Tests (`k6/`)

- Configuration entirely via env vars: `BASE_URL`, `VUS`, `DURATION` (or a staged
  ramp), and either `AUTH_TOKEN` or auto-bootstrap via `test-login`.
- Three scripts, each a k6 scenario. Thresholds are **defined but report-only**
  (do not fail the run) so a single run always produces complete data:
  - `crud.js` — login then GET list conferences / submissions / users
    (read-heavy, DB-bound, high-traffic).
  - `matching.js` — POST the auto-assign / reviewer-suggestion endpoint for a
    seeded conference.
  - `coi.js` — the COI-check endpoint for seeded submission/reviewer pairs
    (exercises the full Neo4j query path when a graph is loaded).
- Output per script:
  - Raw stream: `--out json=results/<script>-<timestamp>.json`.
  - Structured summary: `handleSummary()` exports the end-of-test metrics to
    `results/<script>-<timestamp>.summary.csv`.

## 6. Component: Go Micro-Benchmarks (`micro/`)

- `matching_bench_test.go`: generates synthetic score matrices at multiple sizes
  (e.g. 50×50, 200×500, 500×2000 submissions×reviewers) and benchmarks the
  `AssignmentMatcher`.
- `coi_bench_test.go`: builds in-memory `[]commons.Submission` / `[]commons.Reviewer`
  slices at varying sizes and benchmarks `CompositeDetector.DetectConflicts` with
  the basic detectors (self-author + declared) — pure CPU, no DB.
- `coi_graph_bench_test.go`: benchmarks the `RelationshipDetector` against a
  running Neo4j with a seeded graph. Skips itself (via `testing.Short()` / a env
  guard) when Neo4j is unavailable.
- Run with `go test ./micro -bench=. -benchmem -count=N`, output captured to
  `results/micro-<timestamp>.txt` (parseable by `benchstat`).

## 7. How to Run

```bash
cd backend/benchmarks
cp config/env.example .env   # edit BASE_URL, dataset sizes, Neo4j conn

# 1. Seed Postgres app data over HTTP
go run ./seed --conferences 1 --reviewers 200 --submissions 500
#    -> writes results/seed-summary.json

# 2. (optional) Seed the co-authorship graph directly into Neo4j
go run ./seed --graph-only --authors 500 --coauthor-edges 4000
#    -> generates CSV and loads via the graph_ingestion bolt loader

# 3. HTTP load tests
k6 run -e BASE_URL=$BASE_URL k6/crud.js
k6 run -e BASE_URL=$BASE_URL k6/matching.js
k6 run -e BASE_URL=$BASE_URL k6/coi.js

# 4. Micro-benchmarks
go test ./micro -bench=. -benchmem -count=5 | tee results/micro.txt
```

`run.sh` wraps all of the above into a single command with a timestamped results
directory. No changes to the backend `Makefile` are required (an optional
convenience target may be added later).

## 8. Configuration

`config/env.example` documents:
- `BASE_URL` — backend base URL (e.g. `http://localhost:8080`).
- `VUS`, `DURATION` — k6 load parameters.
- `AUTH_TOKEN` (optional) — pre-supplied JWT; otherwise auto-bootstrapped.
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASS` — for optional graph seeding.
- Dataset size flags mirrored as env vars for `run.sh`.

## 9. Verification

- **Seed tool:** asserts HTTP 2xx on each create; fails fast with a clear summary
  of what succeeded/failed.
- **k6 scripts:** a `--vus 1 --duration 5s` smoke run confirms endpoints + auth
  resolve before a full run.
- **Micro-benchmarks:** must compile and produce non-zero iterations; graph
  benchmark skips cleanly when Neo4j is absent.

## 10. Risks & Notes

- Local runs reflect dev hardware; the report should record the environment
  (CPU, RAM, whether caches were warm, dataset sizes) alongside the numbers.
- `test-login` requires the server to run in `development`/`test` env; against a
  hardened staging/prod env, supply `AUTH_TOKEN` instead.
- Graph-based COI numbers are only meaningful when a co-authorship graph is
  loaded; otherwise the relationship detector returns no graph conflicts (still
  exercises the Neo4j query path).
