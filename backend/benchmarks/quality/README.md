# Matching Quality Benchmark

Measures the **quality** (not speed) of the two similarity-matching features:

- **Reviewer suggestion** (`internal/service/reviewer_suggestion`) — a *ranking*
  problem: given a topic set, rank candidate reviewers.
- **Assignment suggestion** (`internal/assignment` + `internal/assignment/matching`)
  — a *constrained-optimization* problem: allocate the whole paper×reviewer matrix
  under COI + load constraints via the two-pass greedy matcher.

Both use **Jaccard set similarity** on keyword/domain overlap (`|A∩B| / |A∪B|`),
purely lexical — no embeddings, no ML. This benchmark quantifies how good those
matches are, imports the real production code, and is fully offline + deterministic.

> Speed benchmarks live separately in `benchmarks/micro`. Design docs:
> `docs/superpowers/specs/2026-07-05-matching-quality-benchmark-design.md` and
> `docs/superpowers/plans/2026-07-05-matching-quality-benchmark.md`.

---

## ⚠️ Current data status: SYNTHETIC

The committed dataset `testdata/s2_snapshot.json` is **synthetic** (produced by
`gen/`, see below), because a valid Semantic Scholar API key was not available at
build time (the key in `backend/.env` returns `403`, and the keyless public API is
too `429`-throttled to crawl). **Any numbers reported from it must be described as
results on a synthetic dataset.** Swap in real data once a valid key exists
(`go run ./fetch`) — the schema is identical, so nothing else changes.

---

## Quick start

All commands run from the `backend/` directory.

```bash
# 1. Run the benchmark → writes the results artifact (offline, deterministic)
go test ./benchmarks/quality/ -run TestQuality -v
#    → benchmarks/quality/results/quality-results.md  and  .csv

# 2. Run the whole test suite (unit + end-to-end)
go test ./benchmarks/quality/... -v      # 25 tests
go vet   ./benchmarks/quality/...

# 3. (Re)generate the SYNTHETIC dataset fixture
go run ./benchmarks/quality/gen --out benchmarks/quality/testdata/s2_snapshot.json --authors 60

# 4. Fetch a REAL dataset (needs a valid SEMANTIC_SCHOLAR_API_KEY in backend/.env)
cd benchmarks/quality && go run ./fetch --authors-per-query 20 --papers-per-author 50
```

---

## The three entry points ("scripts")

| Command | What it does | Needs network / key? |
|---|---|---|
| `go test ./benchmarks/quality/ -run TestQuality` | Runs the benchmark against the committed fixture, writes `results/quality-results.{md,csv}` | No |
| `go run ./benchmarks/quality/gen` | Generates a **synthetic** `s2_snapshot.json` (deterministic) | No |
| `go run ./fetch` (from `benchmarks/quality`) | Fetches a **real** `s2_snapshot.json` from Semantic Scholar | Yes (key strongly recommended) |

`gen` and `fetch` both emit the **same** `Snapshot` JSON schema, so the benchmark
consumes either interchangeably.

### `gen/` — synthetic data generator
Creates authors clustered into 8 research subfields (nlp, vision, graph, rl, ir,
speech, systems, theory), each with a coherent topic fingerprint (2–3 topics from
its field) plus a 30% chance of one cross-field topic (realistic partial overlap).
Deterministic via `--seed` (default 42).

```bash
go run ./benchmarks/quality/gen \
  --out benchmarks/quality/testdata/s2_snapshot.json \
  --authors 60 --seed 42
```

### `fetch/` — real Semantic Scholar fetcher
Reuses `internal/clients/semantic_scholar`. Discovers authors across seed topic
queries, pulls each author's papers, extracts topics from titles (+ any S2 fields),
and writes the snapshot. It **auto-reads `SEMANTIC_SCHOLAR_API_KEY` from `.env`**
(tries `./.env` then `../../.env` = `backend/.env`) — no `export` needed — and
retries `429`s with backoff.

```bash
cd backend/benchmarks/quality
go run ./fetch --authors-per-query 20 --papers-per-author 50
# overwrites testdata/s2_snapshot.json; commit the result
```

Keyless works in principle but the free public pool is heavily `429`-throttled;
a valid key is required for a real crawl. Verify a key before using it:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "x-api-key: YOUR_KEY" \
  "https://api.semanticscholar.org/graph/v1/author/search?query=nlp&limit=1"
# 200 = good, 403 = invalid/rejected key
```

To request a key (approval takes days): <https://www.semanticscholar.org/product/api#api-key-form>

---

## How it works

### Reviewer suggestion — leave-one-out authorship (proxy ground truth)
There is no gold reviewer-assignment dataset, so relevance is proxied by
authorship: **an author is a qualified reviewer for their own paper's topics.**
For each author with ≥2 papers, one paper is held out as a query; the author's
profile is built from the rest. The Jaccard scorer ranks all reviewers for the
query, and we record where the true author lands.

- **Metrics:** Hit@1, Hit@5, Hit@10, MRR, nDCG@10.
- **Baselines:** `random` (floor) and `overlap_count` (raw intersection size, no
  union normalization — isolates whether Jaccard's normalization helps).

### Assignment suggestion — intrinsic metrics
Builds a conference scenario (papers→submissions, authors→reviewers, self-authorship
COI), runs the real `matching.Greedy`, and compares to `random` and `round_robin`
baselines (both respecting COI + load caps).

- **Metrics:** coverage (% papers with ≥ min reviewers), load balance (StdDev +
  Gini), COI violations (must be 0), mean/min assigned-pair score, fallback rate.

### Files
```
benchmarks/quality/
  topics.go              ExtractTopics — title/field → mid-granularity topics
  metrics.go             HitAtK, MRR, NDCGAtK, Mean, Min, StdDev, Gini
  fixture.go             Snapshot types, LoadSnapshot, BuildRankingEval, BuildAssignmentScenario
  rankers.go             Jaccard / OverlapCount / Random rankers + EvaluateRanker
  assigners.go           Greedy / Random / RoundRobin assigners
  assignment_metrics.go  EvaluateAssignment (coverage, load, COI, score…)
  report.go              ComputeFixtureStats + WriteReport (md + csv)
  ranking_eval_test.go   TestQualityRanking  (end-to-end, writes artifact)
  assignment_eval_test.go TestQualityAssignment + TestQualityReport
  *_test.go              unit tests for each of the above
  gen/main.go            synthetic dataset generator
  fetch/                 real Semantic Scholar fetcher (main.go, snapshot.go)
  testdata/s2_snapshot.json   the dataset (currently synthetic)
  results/               generated quality-results.{md,csv}
```

---

## Current results (synthetic: 60 authors, 250 papers, 8 subfields)

Auto-generated into `results/quality-results.md` — regenerate with
`go test ./benchmarks/quality/ -run TestQuality`. Snapshot:

**Reviewer Suggestion (ranking)**

| Method        | Hit@1 | Hit@5 | Hit@10 |  MRR  | nDCG@10 |
|---------------|-------|-------|--------|-------|---------|
| jaccard       | 0.083 | 0.683 | 0.867  | 0.323 |  0.448  |
| overlap_count | 0.183 | 0.600 | 0.867  | 0.364 |  0.477  |
| random        | 0.017 | 0.083 | 0.167  | 0.078 |  0.076  |

**Assignment Suggestion (optimization)**

| Method      | Coverage | Load StdDev | Load Gini | COI | Mean Score | Min Score | Fallback |
|-------------|----------|-------------|-----------|-----|------------|-----------|----------|
| greedy      |  0.748   |    0.915    |   0.035   |  0  |   0.338    |   0.143   |  0.092   |
| round_robin |  1.000   |    0.596    |   0.036   |  0  |   0.037    |   0.000   |  0.000   |
| random      |  1.000   |    1.193    |   0.062   |  0  |   0.035    |   0.000   |  0.000   |

**Reading:**
- Both matchers beat `random` clearly (random MRR 0.078 = the theoretical
  H(N)/N floor for single-relevant leave-one-out).
- Greedy assigns ~9× more relevant reviewers than the baselines (mean 0.338 vs
  ~0.036) with a non-zero *minimum* score and **zero COI violations**.
- Known soft spots (honest, partly data/algorithm artifacts): `overlap_count`
  slightly beats `jaccard` on MRR (union-normalization penalizes broad profiles);
  greedy coverage is 0.75 because its pass-2 fallback only rescues papers with
  *zero* reviewers, not papers stuck below the minimum.

---

## Caveats (must be stated when reporting)

1. **Synthetic dataset** (see top). Real numbers pending a valid S2 key.
2. **Proxy bias:** leave-one-out authorship rewards exactly the topical overlap
   Jaccard measures, and counts only the true author as relevant (co-authors and
   other qualified reviewers count as misses). It measures topical-fingerprint
   consistency, not absolute reviewer suitability.
3. **Lexical matching:** exact-string overlap, so `"NLP"` ≠ `"Natural Language
   Processing"` — synonyms are misses.

---

## Getting real numbers later

1. Obtain a valid Semantic Scholar API key (form linked above; ~days).
2. Put it in `backend/.env`: `SEMANTIC_SCHOLAR_API_KEY=<key>` (verify with the curl
   above → `200`).
3. `cd backend/benchmarks/quality && go run ./fetch`  (overwrites the fixture).
4. `cd ../.. && go test ./benchmarks/quality/ -run TestQuality`  (regenerates
   `results/`). Same tables, real data, zero code changes.
