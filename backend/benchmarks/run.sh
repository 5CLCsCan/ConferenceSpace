#!/usr/bin/env bash
# Runs the full benchmark suite against $BASE_URL and collects raw results.
set -euo pipefail

cd "$(dirname "$0")/.."   # -> backend/

if [ -f benchmarks/.env ]; then
  set -a
  # shellcheck source=/dev/null
  . benchmarks/.env
  set +a
fi

BASE_URL="${BASE_URL:-http://localhost:8080}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="benchmarks/results/run-${STAMP}"
mkdir -p "$OUT"

# Resource monitoring defaults on only for a local BASE_URL; override with MONITOR=0/1.
case "$BASE_URL" in
  *localhost*|*127.0.0.1*) MONITOR_DEFAULT=1 ;;
  *) MONITOR_DEFAULT=0 ;;
esac
MONITOR="${MONITOR:-$MONITOR_DEFAULT}"
MON_PID=""

start_monitor() {
  [ "$MONITOR" = "1" ] || return 0
  echo "==> Building + starting resource monitor"
  go build -o bin/monitor ./benchmarks/monitor
  echo "idle" > "$OUT/phase.txt"
  ./bin/monitor \
    --out "$OUT/resources.jsonl" \
    --phase-file "$OUT/phase.txt" \
    --interval "${MONITOR_INTERVAL:-2s}" &
  MON_PID=$!
}

set_phase() { [ "$MONITOR" = "1" ] && echo "$1" > "$OUT/phase.txt" || true; }

stop_monitor() {
  [ "$MONITOR" = "1" ] || return 0
  [ -n "$MON_PID" ] || return 0
  kill "$MON_PID" 2>/dev/null || true
  wait "$MON_PID" 2>/dev/null || true
  ./bin/monitor --summarize --in "$OUT/resources.jsonl" --out "$OUT/resources.summary.json" || true
}

echo "==> Seeding Postgres app data"
go run ./benchmarks/seed \
  --conferences "${SEED_CONFERENCES:-300}" \
  --submissions-per-conference "${SEED_SUBMISSIONS_PER_CONFERENCE:-50}" \
  --reviewers "${SEED_REVIEWERS:-500}" \
  --reviewers-per-conference "${SEED_REVIEWERS_PER_CONFERENCE:-30}" \
  --concurrency "${SEED_CONCURRENCY:-8}"

SEED_SUMMARY_JSON="$(cat benchmarks/results/seed-summary.json)"

if [ "${SEED_GRAPH:-0}" = "1" ]; then
  echo "==> Seeding Neo4j co-authorship graph"
  go run ./benchmarks/seed --graph-only \
    --authors "${SEED_AUTHORS:-500}" \
    --coauthor-edges "${SEED_COAUTHOR_EDGES:-4000}"
fi

start_monitor

for script in crud matching coi; do
  echo "==> k6 ${script}"
  set_phase "$script"
  k6 run \
    -e "BASE_URL=${BASE_URL}" \
    -e "VUS=${VUS:-20}" \
    -e "DURATION=${DURATION:-30s}" \
    -e "SEED_SUMMARY=${SEED_SUMMARY_JSON}" \
    --out "json=${OUT}/${script}.raw.json" \
    "benchmarks/k6/${script}.js" || echo "k6 ${script} returned non-zero (thresholds report-only)"
  set_phase "idle"
done

stop_monitor

echo "==> Go micro-benchmarks"
go test ./benchmarks/micro -bench=. -benchmem -run='^$' -count=5 | tee "${OUT}/micro.txt"

echo "==> Done. Raw results in ${OUT} (incl. resources.jsonl + resources.summary.json) and benchmarks/results/*.summary.json"
