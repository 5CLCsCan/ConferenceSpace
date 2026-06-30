# Backend Benchmarks

Environment-agnostic performance suite. See
`docs/superpowers/specs/2026-05-31-backend-benchmarking-design.md` for design.

## Prereqs

- A running backend reachable at `BASE_URL` (dev/test env for `test-login`).
- `k6` installed (https://grafana.com/docs/k6/latest/set-up/install-k6/).
- For graph COI: a reachable Neo4j and the `scripts/graph_ingestion` loader.

## Run

From `backend/`:

```bash
cp benchmarks/config/env.example benchmarks/.env   # optional
export BASE_URL=http://localhost:8080

# 1. Seed Postgres app data (HTTP)
go run ./benchmarks/seed --conferences 1 --reviewers 200 --submissions 500

# 2. (optional) Seed co-authorship graph into Neo4j
go run ./benchmarks/seed --graph-only --authors 500 --coauthor-edges 4000

# 3. HTTP load tests
k6 run -e BASE_URL=$BASE_URL benchmarks/k6/crud.js
k6 run -e BASE_URL=$BASE_URL -e SEED_SUMMARY="$(cat benchmarks/results/seed-summary.json)" benchmarks/k6/matching.js
k6 run -e BASE_URL=$BASE_URL -e SEED_SUMMARY="$(cat benchmarks/results/seed-summary.json)" benchmarks/k6/coi.js

# 4. Micro-benchmarks
go test ./benchmarks/micro -bench=. -benchmem -count=5 | tee benchmarks/results/micro.txt
```

Or run everything:

```bash
./benchmarks/run.sh
```

## Output

Raw results land in `benchmarks/results/` (k6 JSON summaries, micro-bench txt,
`seed-summary.json`). Each `run.sh` run also creates a timestamped directory
under `benchmarks/results/run-<stamp>/`.

## Resource metrics

`run.sh` samples CPU% and memory while the k6 phases run and writes two files
into the run's results dir:

- `resources.jsonl` — one timestamped, phase-tagged sample per tick
  (`go-server` process + the `conferencespace-*` containers).
- `resources.summary.json` — avg/peak CPU% and memory per phase
  (`crud`/`matching`/`coi`) and overall, plus a `host` block (`cpu_cores`,
  `total_mem_mb`).

Requirements and notes:

- The Go server must run locally (bare `go run`/`make server`) and the
  datastores under docker-compose. Monitoring auto-disables when `BASE_URL` is
  remote; force with `MONITOR=1` or disable with `MONITOR=0`.
- `mem_mb` values are **mebibytes (MiB)**.
- `cpu_pct` is **per-core** — values > 100% are expected on multi-core hosts
  under load. Process CPU is a delta over each tick; container CPU comes from
  docker's own sampling window, so the two are not directly comparable.

Run the monitor standalone (e.g. against an already-running server):

```bash
cd backend
go build -o bin/monitor ./benchmarks/monitor
echo idle > benchmarks/results/phase.txt
./bin/monitor --out benchmarks/results/resources.jsonl --phase-file benchmarks/results/phase.txt &
# ... drive load, edit phase.txt to tag phases ...
kill %1; wait %1 2>/dev/null || true
./bin/monitor --summarize --in benchmarks/results/resources.jsonl --out benchmarks/results/resources.summary.json
```

## Graph COI micro-benchmark

Set `BENCH_NEO4J=1` and seed the graph first:

```bash
go test ./benchmarks/micro -bench=BenchmarkCOI_Graph -benchmem -count=5
```
