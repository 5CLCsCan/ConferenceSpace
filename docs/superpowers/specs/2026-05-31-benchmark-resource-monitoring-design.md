# Benchmark Resource Monitoring — Design

**Date:** 2026-05-31
**Status:** Approved (pending spec review)

## 1. Goal & Scope

Extend the existing backend benchmark suite
(`docs/superpowers/specs/2026-05-31-backend-benchmarking-design.md`) so that a
run also captures **basic host/process resource metrics — CPU and RAM — for the
backend server and its datastores while load is applied**. Today the suite
records only application-level metrics (k6 HTTP latency/throughput, Go
micro-bench `ns/op`). It cannot answer "how much CPU/RAM did COI checks burn at
scale", which the performance report needs.

### In scope
- CPU% and resident memory (MB) sampling for:
  - the Go backend server **process** (bare `go run ./cmd/server/main.go`), and
  - the **containers** `conferencespace-db` (Postgres), `conferencespace-redis`
    (Redis), `conferencespace-neo4j` (Neo4j).
- A continuous time-series of samples for the whole run.
- A per-phase summary (avg + peak) attributing resource use to the `crud`,
  `matching`, and `coi` k6 scenarios, plus an overall block.
- Wiring into `run.sh` and documentation in the benchmark README.

### Out of scope
- Disk I/O, network throughput, file-descriptor counts, GC pause metrics.
- A full observability stack (Prometheus/cAdvisor/Grafana) — rejected as
  overkill for a one-off performance report (YAGNI).
- Sampling the AI service or frontend.
- In-process Go runtime metrics (`runtime.MemStats`) — process-level RSS via
  `ps` is sufficient and stack-agnostic.

## 2. Approach

A small Go program under `backend/benchmarks/monitor/` (chosen over a bash
sampler and over a Prometheus stack). Rationale:

- The suite already requires the Go toolchain (`seed/`, `micro/`), so no new
  dependency is introduced.
- Robust JSON output matches the rest of the suite (k6 `*.summary.json`,
  `seed-summary.json`).
- Per-phase aggregation (avg/peak grouped by phase + target) and text parsing of
  `ps` / `docker stats` are trivial and unit-testable in Go, versus fragile
  float math and string parsing in shell.

The stack is **hybrid**: the Go server runs bare on the host while datastores run
in docker-compose. The monitor therefore samples the server via `ps` and the
datastores via `docker stats`, unifying both into one sample stream.

## 3. Component: Monitor (`benchmarks/monitor/`)

A single Go binary with two modes selected by flag.

### 3.1 Sample mode (default)

Runs in the background for the duration of a benchmark run.

**Target discovery**
- **Server process:** PID resolved **once at startup** (before load) by `--pid` /
  `SERVER_PID` if set, else auto-detected via
  `lsof -ti tcp:$SERVER_PORT -sTCP:LISTEN` (default port 8080). The
  `-sTCP:LISTEN` filter is required so the result is the listening server and not
  k6's own client sockets on the same port during a run. The listening process is
  the compiled `go run` child binary, which is the correct process to measure.
  The PID is not re-resolved per tick; if the server restarts mid-run the monitor
  keeps targeting the original PID (acceptable for a one-off report — a dead PID
  simply yields skipped process samples).
- **Containers:** names from `--containers` / `CONTAINERS` (comma-separated),
  default `conferencespace-db,conferencespace-redis,conferencespace-neo4j`.

**Sampling**
- **Process CPU (delta-based):** CPU% is computed from the change in accumulated
  CPU time between consecutive ticks, not from `ps %cpu`. `ps %cpu` reports a
  decaying/lifetime average (on Linux a whole-lifetime average), which barely
  responds to per-phase load and would make per-phase attribution meaningless.
  Instead each tick reads accumulated CPU seconds via `ps -o cputime= -p <pid>`
  (format `[[DD-]HH:]MM:SS`), and
  `cpu_pct = (cputime_now - cputime_prev) / (wall_now - wall_prev) * 100`
  (per-core; may exceed 100 on multi-core). The first tick has no previous sample
  so its process `cpu_pct` is `null`.
- **Process memory:** `ps -o rss= -p <pid>` → RSS in KB, converted to MB.
- **Containers:** a single `docker stats --no-stream --format '{{json .}}'`
  **without naming containers** (returns all running containers), then filter to
  the target names. Querying by name would make the whole call fail with
  `No such container` if any one target is down; querying all and filtering means
  a missing target is simply absent from the tick (consistent with §5). Parse
  `CPUPerc` (e.g. `"40.2%"`) and the used side of `MemUsage`
  (e.g. `"318MiB / 512MiB"` → 318.0 MB). Unit suffixes handled: `B`, `KiB`/`KB`,
  `MiB`/`MB`, `GiB`/`GB`. Container CPU% comes from docker's own sampling window
  and is not directly comparable to the process delta window above; both are
  recorded as-is and this difference is documented.

**Phase tagging**
- Each tick reads a single-line control file (`--phase-file`). Its trimmed
  contents (e.g. `crud`, `matching`, `coi`, `idle`) tag every sample in that
  tick. Missing/empty file → phase `unknown`.

**Output**
- Appends one JSON object per tick to `--out` (default
  `benchmarks/results/resources.jsonl`). Interval from `--interval` (default
  `2s`) is **best-effort**: `docker stats --no-stream` itself blocks ~1–2s per
  call, so the real cadence will exceed the nominal interval. Each sample carries
  an absolute `ts`, and the summary is driven by those timestamps and the actual
  sample count — never by an assumed cadence.

Sample line:

```json
{"ts":"2026-05-31T14:55:02Z","phase":"crud","targets":[
  {"name":"go-server","kind":"process","cpu_pct":83.1,"mem_mb":142.6},
  {"name":"conferencespace-db","kind":"container","cpu_pct":40.2,"mem_mb":318.0},
  {"name":"conferencespace-redis","kind":"container","cpu_pct":1.1,"mem_mb":12.4},
  {"name":"conferencespace-neo4j","kind":"container","cpu_pct":15.0,"mem_mb":402.7}
]}
```

The loop runs until it receives SIGINT/SIGTERM, then exits cleanly (flushing the
last write).

### 3.2 Summarize mode (`--summarize`)

Reads `--in` (a `resources.jsonl`) and writes `--out`
(`resources.summary.json`). Groups samples by `(phase, target)` and computes
**avg** and **peak** for both `cpu_pct` and `mem_mb`, plus an `overall` block
across all phases. `null` process `cpu_pct` values (e.g. the first tick) are
excluded from avg/peak. A `host` block records `cpu_cores` and `total_mem_mb`
(from `runtime.NumCPU()` and the OS) so CPU% and memory figures can be
interpreted in the report.

Note: `mem_mb` values are **mebibytes** (process RSS is KiB÷1024; docker
`MemUsage` is already MiB). The field name is kept as `mem_mb` for brevity; the
README documents that it means MiB.

```json
{
  "generated_at": "2026-05-31T15:01:00Z",
  "interval_sec": 2,
  "host": {"cpu_cores": 10, "total_mem_mb": 32768},
  "phases": {
    "coi": {
      "samples": 15,
      "targets": {
        "go-server":          {"cpu_pct": {"avg": 70.2, "peak": 91.0}, "mem_mb": {"avg": 150.1, "peak": 165.0}},
        "conferencespace-db": {"cpu_pct": {"avg": 88.5, "peak": 120.3}, "mem_mb": {"avg": 360.0, "peak": 380.2}}
      }
    }
  },
  "overall": {
    "samples": 60,
    "targets": { "go-server": {"cpu_pct": {"avg": 55.0, "peak": 91.0}, "mem_mb": {"avg": 140.0, "peak": 165.0}} }
  }
}
```

## 4. Orchestration (`run.sh`)

**Monitoring window:** the monitor wraps **only the k6 load phases**. Seeding
(which runs before the k6 loop) and the Go micro-benchmarks (which run after) are
outside the window and are not resource-sampled — they are not HTTP load and are
out of scope for this feature.

1. Build once: `go build -o bin/monitor ./benchmarks/monitor`.
2. Start sampler in background **after seeding, just before the k6 loop**, and
   capture its PID:
   `bin/monitor --out "$OUT/resources.jsonl" --phase-file "$OUT/phase.txt" --interval "${MONITOR_INTERVAL:-2s}" & MON_PID=$!`
3. Initialize `phase.txt` with `idle`.
4. Before each k6 scenario, `echo <scenario> > "$OUT/phase.txt"`; after it, write
   `idle`.
5. After the last scenario, tear down with `set -e`-safe guards (a SIGTERM'd
   `wait` returns 143, which would otherwise abort the script under
   `set -euo pipefail`):
   `kill "$MON_PID" 2>/dev/null || true; wait "$MON_PID" 2>/dev/null || true`,
   then
   `bin/monitor --summarize --in "$OUT/resources.jsonl" --out "$OUT/resources.summary.json"`.
6. Monitoring is gated by `MONITOR`. It defaults to `1` **only when `BASE_URL` is
   local** (`localhost`/`127.0.0.1`); against a remote `BASE_URL` it defaults to
   `0`, since `ps`/`lsof`/`docker stats` can only observe local processes and
   containers. An explicit `MONITOR=0`/`MONITOR=1` always overrides.

## 5. Error Handling

Monitoring must never fail or slow the benchmark:
- Missing `docker` binary or unavailable container → that target is omitted from
  the tick (logged once to stderr), other targets still recorded.
- Server PID not resolvable → log a warning, sample only containers.
- A failed `ps`/`docker` invocation for one tick → skip that tick's affected
  target, continue the loop.
- `--summarize` on an empty/absent JSONL → write an empty summary with
  `"samples": 0` and exit 0.

## 6. Configuration

| Flag | Env | Default | Purpose |
|------|-----|---------|---------|
| `--pid` | `SERVER_PID` | auto (`lsof`) | server process PID |
| `--server-port` | `SERVER_PORT` | `8080` | port for PID auto-detect |
| `--containers` | `CONTAINERS` | `conferencespace-db,conferencespace-redis,conferencespace-neo4j` | container names |
| `--interval` | `MONITOR_INTERVAL` | `2s` | sampling interval |
| `--out` | — | `benchmarks/results/resources.jsonl` | sample stream (sample mode) |
| `--phase-file` | — | `benchmarks/results/phase.txt` | current-phase control file |
| `--summarize` | — | off | switch to summarize mode |
| `--in` | — | `benchmarks/results/resources.jsonl` | input (summarize mode) |
| (`run.sh`) | `MONITOR` | `1` if `BASE_URL` is local, else `0` | enable/disable monitoring in run.sh |

## 7. Testing

Unit tests (pure functions, canned input — no live processes):
- `parseCPUTime`: parse `cputime` strings (`SS`, `MM:SS`, `HH:MM:SS`,
  `DD-HH:MM:SS`) into seconds.
- `processCPUPercent`: delta CPU% from two (cputime, wall) pairs, including the
  first-tick `null` case and a zero/negative wall-delta guard.
- `parseRSS`: parse `ps -o rss=` KB → MB conversion.
- `parseDockerStats`: parse `CPUPerc` and `MemUsage` JSON rows, all unit
  suffixes, and filtering all-container output down to the target names
  (including a missing target).
- `summarize`: avg/peak grouping by phase+target over a fixed set of sample
  lines, excluding `null` cpu values, including the empty-input case.

The live sampling loop (timers, `lsof`/`docker`/`ps` exec, signal handling) is
not unit-tested; it is exercised manually via `run.sh`.

## 8. Output Artifacts

Per run, under `benchmarks/results/` (or the `run.sh` timestamped dir):
- `resources.jsonl` — continuous time-series, phase-tagged.
- `resources.summary.json` — per-phase + overall avg/peak CPU & RAM.

## 9. Documentation

README gains a "Resource metrics" section covering: what is sampled, the
requirement that the server be local and datastores run under docker-compose
(monitoring auto-disables for a remote `BASE_URL`), how to read the two
artifacts (`resources.jsonl`, `resources.summary.json`) and the `host` block, the
`MONITOR=0` opt-out, that `mem_mb` means MiB, and the caveat that CPU% is
per-core (values > 100% are expected on multi-core hosts under load) with process
vs container CPU measured over different windows.
