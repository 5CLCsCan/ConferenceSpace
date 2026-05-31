# Backend Benchmarking Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an environment-agnostic backend benchmark suite — k6 HTTP load tests (CRUD, matching, COI) plus Go micro-benchmarks for the matching and COI algorithms — that emits raw CSV/JSON results for a performance report.

**Architecture:** A new `backend/benchmarks/` tree inside the existing Go module. Go micro-benchmarks import the real `internal/assignment/...` packages and run over synthetic in-memory inputs. A Go seed tool populates Postgres app data over HTTP and (optionally) loads a synthetic co-authorship graph into Neo4j by reusing the existing `scripts/graph_ingestion` loader. k6 scripts drive real endpoints, parameterized entirely by env vars.

**Tech Stack:** Go 1.24 (`testing.B`), k6 (JavaScript), the existing `tests/api/testutils` HTTP patterns, the existing `scripts/graph_ingestion` Neo4j bolt loader.

---

## Conventions

- The benchmarks live under `backend/benchmarks/` and are part of module `github.com/dcao/conferencespace`.
- All Go commands below run from `backend/`.
- Spec: `docs/superpowers/specs/2026-05-31-backend-benchmarking-design.md`.
- Known route paths (verified against `cmd/server/main.go`):
  - `POST /api/v1/auth/test-login` — body `{email, first_name, last_name}` → `{data:{token, user:{id,email,...}}}` (dev/test env only)
  - `GET  /api/v1/conferences?limit=&offset=`
  - `POST /api/v1/conferences` — body `{conference:{...}}` → `{data:{...,id}}`
  - `GET  /api/v1/conferences/:conference_id/submissions?limit=&offset=`
  - `POST /api/v1/conferences/:conference_id/submissions/auto-assign`
  - `GET  /api/v1/conferences/:conference_id/reviewer-suggestions` — requires chair role on the conference (`requireChair`)
  - `GET  /api/v1/coi/check/reviewer/:reviewer_id/author/:author_email?conference_id=` — auth + chair/co-chair of `conference_id`; `conference_id` query is REQUIRED
  - `GET  /api/v1/users/search?q=&limit=&conference_id=` — `q` REQUIRED (matches email); `limit` (≤50) and `conference_id` (match annotation) optional
  - `POST /api/v1/conferences/:conference_id/submissions` — multipart/form-data; `submission` field holds `{"submission":{...}}`; PDF `file` required only for status `published`; author must NOT be a chair/co-chair/PC of the conference

---

## Task 1: Scaffold benchmark tree

**Files:**
- Create: `backend/benchmarks/results/.gitkeep`
- Create: `backend/benchmarks/config/env.example`
- Create: `backend/benchmarks/README.md`

- [ ] **Step 1: Create the directory skeleton and results placeholder**

```bash
mkdir -p backend/benchmarks/{seed,k6/lib,micro,results,config}
touch backend/benchmarks/results/.gitkeep
```

- [ ] **Step 2: Write `backend/benchmarks/config/env.example`**

```bash
# Backend base URL the benchmarks target
BASE_URL=http://localhost:8080

# k6 load parameters
VUS=20
DURATION=30s

# Optional pre-supplied JWT. If empty, scripts/seed bootstrap via /auth/test-login.
AUTH_TOKEN=

# Dataset sizes for the seed tool
SEED_CONFERENCES=1
SEED_REVIEWERS=200
SEED_SUBMISSIONS=500
SEED_DECLARED_CONFLICTS=100

# Neo4j connection for optional co-authorship graph seeding
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASS=conferencespace
SEED_AUTHORS=500
SEED_COAUTHOR_EDGES=4000
```

- [ ] **Step 3: Write `backend/benchmarks/README.md`**

```markdown
# Backend Benchmarks

Environment-agnostic performance suite. See
`docs/superpowers/specs/2026-05-31-backend-benchmarking-design.md` for design.

## Prereqs
- A running backend reachable at `BASE_URL` (dev/test env for `test-login`).
- `k6` installed (https://grafana.com/docs/k6/latest/set-up/install-k6/).
- For graph COI: a reachable Neo4j and the `scripts/graph_ingestion` loader (run via `go run .`).

## Run
    cd backend/benchmarks
    cp config/env.example .env && $EDITOR .env

    # 1. Seed Postgres app data (HTTP)
    go run ../benchmarks/seed --conferences 1 --reviewers 200 --submissions 500

    # 2. (optional) Seed co-authorship graph into Neo4j
    go run ../benchmarks/seed --graph-only --authors 500 --coauthor-edges 4000

    # 3. HTTP load tests
    k6 run -e BASE_URL=$BASE_URL k6/crud.js
    k6 run -e BASE_URL=$BASE_URL k6/matching.js
    k6 run -e BASE_URL=$BASE_URL k6/coi.js

    # 4. Micro-benchmarks
    go test ./benchmarks/micro -bench=. -benchmem -count=5 | tee benchmarks/results/micro.txt

Or run everything: `./run.sh`

## Output
Raw results land in `benchmarks/results/` (k6 JSON + summary CSV, micro-bench txt).
```

- [ ] **Step 4: Commit**

```bash
git add backend/benchmarks
git commit -m "chore(bench): scaffold benchmark tree, config, and README"
```

---

## Task 2: Synthetic data generators for micro-benchmarks

**Files:**
- Create: `backend/benchmarks/micro/generators.go`
- Test: `backend/benchmarks/micro/generators_test.go`

- [ ] **Step 1: Write the failing test**

```go
package micro

import "testing"

func TestGenCOIInputsShape(t *testing.T) {
	subs, revs := GenCOIInputs(10, 20, 0.5)
	if len(subs) != 10 {
		t.Fatalf("want 10 submissions, got %d", len(subs))
	}
	if len(revs) != 20 {
		t.Fatalf("want 20 reviewers, got %d", len(revs))
	}
	// With conflictRatio 0.5, ~half the submissions declare a real reviewer email.
	declared := 0
	for _, s := range subs {
		if len(s.Declared) > 0 {
			declared++
		}
	}
	if declared == 0 {
		t.Fatalf("expected some declared conflicts, got 0")
	}
}

func TestGenScoreMatrixShape(t *testing.T) {
	m := GenScoreMatrix(5, 8)
	if len(m) != 40 {
		t.Fatalf("want 40 score entries, got %d", len(m))
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && go test ./benchmarks/micro -run TestGen -v`
Expected: FAIL — `undefined: GenCOIInputs` / `undefined: GenScoreMatrix`

- [ ] **Step 3: Write the generators**

```go
package micro

import (
	"fmt"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/scoring"
)

// reviewerEmail returns a deterministic email for reviewer index i.
func reviewerEmail(i int) string { return fmt.Sprintf("reviewer-%d@example.com", i) }

// GenCOIInputs builds in-memory COI detector inputs.
// conflictRatio in [0,1] controls how many submissions declare a conflict
// against a real reviewer (drives the declared-conflicts detector work).
func GenCOIInputs(numSubs, numReviewers int, conflictRatio float64) ([]commons.Submission, []commons.Reviewer) {
	reviewers := make([]commons.Reviewer, numReviewers)
	for i := 0; i < numReviewers; i++ {
		reviewers[i] = commons.Reviewer{
			ID:        int64(i + 1),
			UserID:    int64(i + 1),
			UserEmail: reviewerEmail(i),
		}
	}

	conflictEvery := 0
	if conflictRatio > 0 {
		conflictEvery = int(1.0 / conflictRatio)
	}

	submissions := make([]commons.Submission, numSubs)
	for i := 0; i < numSubs; i++ {
		sub := commons.Submission{
			ID:          int64(i + 1),
			AuthorEmail: fmt.Sprintf("author-%d@example.com", i),
			CoAuthors:   []string{fmt.Sprintf("coauthor-%d@example.com", i)},
		}
		if conflictEvery > 0 && i%conflictEvery == 0 && numReviewers > 0 {
			sub.Declared = []commons.ConflictDeclaration{
				{Email: reviewerEmail(i % numReviewers), Reason: "prior collaboration"},
			}
		}
		submissions[i] = sub
	}
	return submissions, reviewers
}

// GenScoreMatrix builds a dense numSubs x numReviewers score matrix.
func GenScoreMatrix(numSubs, numReviewers int) scoring.ScoreMatrix {
	m := make(scoring.ScoreMatrix, 0, numSubs*numReviewers)
	for s := 0; s < numSubs; s++ {
		for r := 0; r < numReviewers; r++ {
			// Deterministic pseudo-score in (0,1].
			score := float64((s*31+r*17)%100+1) / 100.0
			m = append(m, scoring.ScoreEntry{
				SubmissionID: int64(s + 1),
				ReviewerID:   int64(r + 1),
				Score:        score,
			})
		}
	}
	return m
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && go test ./benchmarks/micro -run TestGen -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/benchmarks/micro/generators.go backend/benchmarks/micro/generators_test.go
git commit -m "feat(bench): add synthetic generators for micro-benchmarks"
```

---

## Task 3: COI detector micro-benchmark (CPU-only)

**Files:**
- Create: `backend/benchmarks/micro/coi_bench_test.go`

- [ ] **Step 1: Write the benchmark**

```go
package micro

import (
	"context"
	"testing"

	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
)

func benchmarkCOI(b *testing.B, numSubs, numReviewers int) {
	subs, revs := GenCOIInputs(numSubs, numReviewers, 0.5)
	det := detectors.NewCompositeDetector(
		detectors.NewSelfAuthorDetector(),
		detectors.NewDeclaredConflictsDetector(),
	)
	ctx := context.Background()

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, err := det.DetectConflicts(ctx, subs, revs); err != nil {
			b.Fatalf("DetectConflicts failed: %v", err)
		}
	}
}

func BenchmarkCOI_Small(b *testing.B)  { benchmarkCOI(b, 50, 50) }
func BenchmarkCOI_Medium(b *testing.B) { benchmarkCOI(b, 500, 200) }
func BenchmarkCOI_Large(b *testing.B)  { benchmarkCOI(b, 2000, 500) }
```

- [ ] **Step 2: Run the benchmark to verify it executes**

Run: `cd backend && go test ./benchmarks/micro -bench=BenchmarkCOI -benchmem -run=^$ -benchtime=10x`
Expected: PASS with three `BenchmarkCOI_*` lines reporting `ns/op` and `allocs/op` (non-zero iterations).

- [ ] **Step 3: Commit**

```bash
git add backend/benchmarks/micro/coi_bench_test.go
git commit -m "feat(bench): add CPU-only COI detector micro-benchmark"
```

---

## Task 4: Reviewer matching micro-benchmark

**Files:**
- Create: `backend/benchmarks/micro/matching_bench_test.go`

- [ ] **Step 1: Write the benchmark**

```go
package micro

import (
	"context"
	"testing"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/matching"
)

func benchmarkMatching(b *testing.B, numSubs, numReviewers int) {
	scores := GenScoreMatrix(numSubs, numReviewers)

	subs := make([]matching.Submission, numSubs)
	for i := range subs {
		subs[i] = matching.Submission{ID: int64(i + 1)}
	}
	revs := make([]matching.Reviewer, numReviewers)
	for i := range revs {
		revs[i] = matching.Reviewer{ID: int64(i + 1)}
	}

	input := matching.MatchInput{
		Submissions: subs,
		Reviewers:   revs,
		Scores:      scores,
		Conflicts:   make(commons.ConflictMap),
		Config: matching.MatchConfig{
			MinReviewersPerPaper: 3,
			MaxReviewersPerPaper: 3,
			MinScoreThreshold:    0.0,
		},
	}

	matcher := matching.NewGreedyMatcher()
	ctx := context.Background()

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, err := matcher.Match(ctx, input); err != nil {
			b.Fatalf("Match failed: %v", err)
		}
	}
}

func BenchmarkMatching_Small(b *testing.B)  { benchmarkMatching(b, 50, 50) }
func BenchmarkMatching_Medium(b *testing.B) { benchmarkMatching(b, 200, 500) }
func BenchmarkMatching_Large(b *testing.B)  { benchmarkMatching(b, 500, 2000) }
```

- [ ] **Step 2: Run the benchmark to verify it executes**

Run: `cd backend && go test ./benchmarks/micro -bench=BenchmarkMatching -benchmem -run=^$ -benchtime=10x`
Expected: PASS with three `BenchmarkMatching_*` lines reporting timings.

- [ ] **Step 3: Commit**

```bash
git add backend/benchmarks/micro/matching_bench_test.go
git commit -m "feat(bench): add reviewer matching micro-benchmark"
```

---

## Task 5: Seed tool — config and HTTP client

**Files:**
- Create: `backend/benchmarks/seed/config.go`
- Create: `backend/benchmarks/seed/client.go`
- Test: `backend/benchmarks/seed/client_test.go`

- [ ] **Step 1: Write the failing test**

```go
package main

import "testing"

func TestParseConfigDefaults(t *testing.T) {
	cfg := parseConfig([]string{})
	if cfg.BaseURL == "" {
		t.Fatal("expected a default BaseURL")
	}
	if cfg.Reviewers <= 0 || cfg.Submissions <= 0 {
		t.Fatalf("expected positive default sizes, got reviewers=%d submissions=%d", cfg.Reviewers, cfg.Submissions)
	}
}

func TestParseConfigFlags(t *testing.T) {
	cfg := parseConfig([]string{"--reviewers", "7", "--submissions", "9", "--base-url", "http://x:1"})
	if cfg.Reviewers != 7 || cfg.Submissions != 9 || cfg.BaseURL != "http://x:1" {
		t.Fatalf("flags not parsed: %+v", cfg)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && go test ./benchmarks/seed -run TestParseConfig -v`
Expected: FAIL — `undefined: parseConfig`

- [ ] **Step 3: Write `config.go`**

```go
package main

import (
	"flag"
	"os"
	"strconv"
)

type Config struct {
	BaseURL            string
	AuthToken          string
	Conferences        int
	Reviewers          int
	Submissions        int
	DeclaredConflicts  int
	Authors            int
	CoauthorEdges      int
	GraphOnly          bool
	Neo4jURI           string
	Neo4jUser          string
	Neo4jPass          string
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func parseConfig(args []string) Config {
	fs := flag.NewFlagSet("seed", flag.ContinueOnError)
	cfg := Config{}
	fs.StringVar(&cfg.BaseURL, "base-url", envOr("BASE_URL", "http://localhost:8080"), "backend base URL")
	fs.StringVar(&cfg.AuthToken, "token", os.Getenv("AUTH_TOKEN"), "pre-supplied JWT (optional)")
	fs.IntVar(&cfg.Conferences, "conferences", envInt("SEED_CONFERENCES", 1), "number of conferences")
	fs.IntVar(&cfg.Reviewers, "reviewers", envInt("SEED_REVIEWERS", 200), "number of reviewers")
	fs.IntVar(&cfg.Submissions, "submissions", envInt("SEED_SUBMISSIONS", 500), "number of submissions")
	fs.IntVar(&cfg.DeclaredConflicts, "declared-conflicts", envInt("SEED_DECLARED_CONFLICTS", 100), "declared conflicts")
	fs.IntVar(&cfg.Authors, "authors", envInt("SEED_AUTHORS", 500), "graph authors")
	fs.IntVar(&cfg.CoauthorEdges, "coauthor-edges", envInt("SEED_COAUTHOR_EDGES", 4000), "graph coauthor edges")
	fs.BoolVar(&cfg.GraphOnly, "graph-only", false, "only seed the Neo4j co-authorship graph")
	fs.StringVar(&cfg.Neo4jURI, "neo4j-uri", envOr("NEO4J_URI", "bolt://localhost:7687"), "Neo4j URI")
	fs.StringVar(&cfg.Neo4jUser, "neo4j-user", envOr("NEO4J_USER", "neo4j"), "Neo4j user")
	fs.StringVar(&cfg.Neo4jPass, "neo4j-pass", envOr("NEO4J_PASS", "conferencespace"), "Neo4j password")
	_ = fs.Parse(args)
	return cfg
}
```

- [ ] **Step 4: Write `client.go`**

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

type apiClient struct {
	baseURL string
	http    *http.Client
}

func newAPIClient(baseURL string) *apiClient {
	return &apiClient{baseURL: baseURL, http: &http.Client{Timeout: 30 * time.Second}}
}

// do performs a JSON request. On non-2xx it returns an error including the body.
func (c *apiClient) do(method, path, token string, body interface{}, out interface{}) error {
	var reader io.Reader
	if body != nil {
		buf, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reader = bytes.NewReader(buf)
	}
	req, err := http.NewRequest(method, c.baseURL+path, reader)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("%s %s -> %d: %s", method, path, resp.StatusCode, string(raw))
	}
	if out != nil && len(raw) > 0 {
		return json.Unmarshal(raw, out)
	}
	return nil
}

// doMultipart performs a multipart/form-data request with simple string fields.
// The submission create endpoint expects multipart form data (see
// handler.HandleSubmissionCreate -> utils.BindSubmissionCreateRequest), with the
// submission payload carried in a single "submission" field as a JSON string.
func (c *apiClient) doMultipart(method, path, token string, fields map[string]string, out interface{}) error {
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	for k, v := range fields {
		if err := mw.WriteField(k, v); err != nil {
			return err
		}
	}
	if err := mw.Close(); err != nil {
		return err
	}
	req, err := http.NewRequest(method, c.baseURL+path, &buf)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("%s %s -> %d: %s", method, path, resp.StatusCode, string(raw))
	}
	if out != nil && len(raw) > 0 {
		return json.Unmarshal(raw, out)
	}
	return nil
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && go test ./benchmarks/seed -run TestParseConfig -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/benchmarks/seed/config.go backend/benchmarks/seed/client.go backend/benchmarks/seed/client_test.go
git commit -m "feat(bench): add seed tool config parsing and HTTP client"
```

---

## Task 6: Seed tool — auth bootstrap and Postgres seeding

**Files:**
- Create: `backend/benchmarks/seed/seed.go`
- Create: `backend/benchmarks/seed/main.go`

- [ ] **Step 1: Write `seed.go` (auth + entity creation + summary)**

```go
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type loginResp struct {
	Data struct {
		Token string `json:"token"`
		User  struct {
			ID    int64  `json:"id"`
			Email string `json:"email"`
		} `json:"user"`
	} `json:"data"`
}

type createdResp struct {
	Data struct {
		ID int64 `json:"id"`
	} `json:"data"`
}

type Summary struct {
	BaseURL        string  `json:"base_url"`
	ChairToken     string  `json:"chair_token"`
	ConferenceIDs  []int64 `json:"conference_ids"`
	SubmissionIDs  []int64 `json:"submission_ids"`
	ReviewerEmails []string `json:"reviewer_emails"`
	GeneratedAt    string  `json:"generated_at"`
}

// login bootstraps a JWT via the dev test-login endpoint.
func login(c *apiClient, email string) (string, int64, error) {
	var resp loginResp
	body := map[string]string{"email": email, "first_name": "Bench", "last_name": "User"}
	if err := c.do("POST", "/api/v1/auth/test-login", "", body, &resp); err != nil {
		return "", 0, fmt.Errorf("test-login failed (is the server in development/test env?): %w", err)
	}
	return resp.Data.Token, resp.Data.User.ID, nil
}

// seedPostgres creates conferences and submissions and returns a summary.
func seedPostgres(c *apiClient, cfg Config) (*Summary, error) {
	token := cfg.AuthToken
	if token == "" {
		t, _, err := login(c, "bench-chair@example.com")
		if err != nil {
			return nil, err
		}
		token = t
	}

	sum := &Summary{
		BaseURL:     cfg.BaseURL,
		ChairToken:  token,
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
	}

	for i := 0; i < cfg.Conferences; i++ {
		acronym := fmt.Sprintf("BENCH%d-%d", i, time.Now().UnixNano())
		// Conference required fields are `title` and `acronym` (dto.Conference
		// binding:"required"); other fields are optional. The body must be
		// wrapped as {"conference": {...}} (dto.ConferenceCreateRequest). Status
		// is left empty: the storage layer defaults a new conference to "open",
		// which is required before submissions are accepted.
		confBody := map[string]interface{}{
			"conference": map[string]interface{}{
				"title":   fmt.Sprintf("Benchmark Conference %d", i),
				"acronym": acronym,
				"venue":   "Benchmark City",
			},
		}
		var cr createdResp
		if err := c.do("POST", "/api/v1/conferences", token, confBody, &cr); err != nil {
			return nil, fmt.Errorf("create conference: %w", err)
		}
		sum.ConferenceIDs = append(sum.ConferenceIDs, cr.Data.ID)

		// Submissions are created by NON-admin authors. Two backend constraints
		// drive this:
		//   1. The create handler rejects chairs/co-chairs/PC members of the
		//      conference (rejectAdminAuthorPath -> 403), so the chair token used
		//      to create the conference CANNOT author a submission in it.
		//   2. An author may submit at most once per conference
		//      (ErrAuthorAlreadySubmitted -> 409 Conflict).
		// So we mint a fresh author per submission via test-login.
		perConf := cfg.Submissions / max(cfg.Conferences, 1)
		path := fmt.Sprintf("/api/v1/conferences/%d/submissions", cr.Data.ID)
		for s := 0; s < perConf; s++ {
			authorEmail := fmt.Sprintf("bench-author-%d-%d@example.com", i, s)
			authorToken, _, err := login(c, authorEmail)
			if err != nil {
				return nil, fmt.Errorf("author login: %w", err)
			}

			// The submission endpoint is multipart/form-data with the payload in
			// a "submission" field, shaped as {"submission": {...}}. A file is
			// only mandatory for status "published"; we omit status so it defaults
			// to "draft", which needs no PDF and bypasses the precheck gate.
			subJSON, err := json.Marshal(map[string]interface{}{
				"submission": map[string]interface{}{
					"title":    fmt.Sprintf("Benchmark Paper %d-%d", i, s),
					"abstract": "Synthetic abstract for benchmarking purposes.",
				},
			})
			if err != nil {
				return nil, err
			}

			var sr createdResp
			fields := map[string]string{"submission": string(subJSON)}
			if err := c.doMultipart("POST", path, authorToken, fields, &sr); err != nil {
				return nil, fmt.Errorf("create submission %d: %w", s, err)
			}
			sum.SubmissionIDs = append(sum.SubmissionIDs, sr.Data.ID)
		}
	}

	for r := 0; r < cfg.Reviewers; r++ {
		sum.ReviewerEmails = append(sum.ReviewerEmails, fmt.Sprintf("bench-reviewer-%d@example.com", r))
	}
	return sum, nil
}

func writeSummary(sum *Summary) (string, error) {
	out := filepath.Join("benchmarks", "results", "seed-summary.json")
	if _, err := os.Stat("benchmarks"); err != nil {
		out = "seed-summary.json" // running from inside benchmarks/
	}
	buf, err := json.MarshalIndent(sum, "", "  ")
	if err != nil {
		return "", err
	}
	if err := os.WriteFile(out, buf, 0o644); err != nil {
		return "", err
	}
	return out, nil
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
```

> NOTE (resolved): Confirmed against `internal/controller/submission/submission.go`, `internal/handler/handler.go:HandleSubmissionCreate`, `internal/utils/submission_binder.go`, `internal/dto/submission.go`, and `tests/api/submission/client.go`. Key facts now reflected above:
> - **Transport:** `POST /conferences/:conference_id/submissions` is **multipart/form-data**, not JSON. The handler calls `ctx.MultipartForm()`, and the binder reads the submission payload from a single `submission` form field containing a JSON string shaped as `{"submission": {...}}`. (This mirrors `tests/api/submission/client.go:CreateWithoutFile`, which uses multipart with no file.)
> - **File requirement:** the paper PDF is mandatory only for status `published`; an omitted/`draft` status creates a draft with no file and skips the precheck gate — exactly what the seed uses.
> - **Author constraint:** the conference chair (the token that created the conference) is rejected as an author (`rejectAdminAuthorPath` -> 403), and each author may submit once per conference (409). The seed therefore mints a distinct `bench-author-i-s@example.com` per submission via `test-login`.
> - **Conference payload:** required fields are `title` + `acronym`; the body is wrapped `{"conference": {...}}`; new conferences default to status `open` (required for submissions). The earlier `"location"` key was not a real field (`dto.Conference` has `venue`) and has been corrected.

- [ ] **Step 2: Write `main.go`**

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	cfg := parseConfig(os.Args[1:])
	c := newAPIClient(cfg.BaseURL)

	if cfg.GraphOnly {
		if err := seedGraph(cfg); err != nil {
			fmt.Fprintf(os.Stderr, "graph seed failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("graph seed complete")
		return
	}

	sum, err := seedPostgres(c, cfg)
	if err != nil {
		fmt.Fprintf(os.Stderr, "seed failed: %v\n", err)
		os.Exit(1)
	}
	path, err := writeSummary(sum)
	if err != nil {
		fmt.Fprintf(os.Stderr, "write summary failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("seeded %d conferences, %d submissions, %d reviewer emails -> %s\n",
		len(sum.ConferenceIDs), len(sum.SubmissionIDs), len(sum.ReviewerEmails), path)
}
```

- [ ] **Step 3: Build to verify it compiles**

Run: `cd backend && go build ./benchmarks/seed`
Expected: builds with no errors. (`seedGraph` is defined in the next task; if building before Task 7, temporarily stub it — see Task 7 Step 1.)

- [ ] **Step 4: Smoke test against a running dev server (manual)**

Run (with `make dev` up): `cd backend && go run ./benchmarks/seed --conferences 1 --reviewers 10 --submissions 5`
Expected: prints a summary line and writes `benchmarks/results/seed-summary.json`. If submission create returns 4xx, fix payload per the NOTE in Step 1.

- [ ] **Step 5: Commit**

```bash
git add backend/benchmarks/seed/seed.go backend/benchmarks/seed/main.go
git commit -m "feat(bench): seed Postgres app data over HTTP with summary output"
```

---

## Task 7: Seed tool — co-authorship graph into Neo4j

**Files:**
- Create: `backend/benchmarks/seed/graph.go`

- [ ] **Step 1: Write `graph.go`**

```go
package main

import (
	"fmt"
	"math/rand"
	"os"
	"os/exec"
	"path/filepath"
)

// seedGraph generates a synthetic co-authorship CSV and loads it into Neo4j
// by invoking the existing bolt loader at scripts/graph_ingestion.
//
// CSV columns match scripts/graph_ingestion/example_data.csv:
//   author_1,author_2,date,metadata
// where `date` is an integer YEAR and `metadata` is optional. The loader skips
// the header row by default (-skip-header=true).
func seedGraph(cfg Config) error {
	// Use an absolute path: the loader runs with cmd.Dir set to its own module
	// directory, so a relative CSV path would not resolve. os.TempDir() is absolute.
	csvPath := filepath.Join(os.TempDir(), "bench_coauthors.csv")
	if err := writeCoauthorCSV(csvPath, cfg.Authors, cfg.CoauthorEdges); err != nil {
		return fmt.Errorf("generate csv: %w", err)
	}

	// Invoke the loader directly. NOTE: the backend Makefile's `graph-import`
	// target does `cd tools/graph_ingestion`, but the loader actually lives at
	// `scripts/graph_ingestion` (separate Go module), so the make target is
	// broken in this repo. We therefore run the loader's own module directly.
	// Connection config is supplied via FLAGS (-uri/-user/-pass), NOT env vars.
	loaderDir := filepath.Join("scripts", "graph_ingestion")
	cmd := exec.Command("go", "run", ".",
		"-file="+csvPath,
		"-uri="+cfg.Neo4jURI,
		"-user="+cfg.Neo4jUser,
		"-pass="+cfg.Neo4jPass,
		"-clear",
	)
	cmd.Dir = loaderDir // scripts/graph_ingestion, relative to backend/
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func writeCoauthorCSV(path string, authors, edges int) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	// Header — MUST match scripts/graph_ingestion: author_1,author_2,date,metadata.
	// The loader skips this row by default and parses `date` with strconv.Atoi
	// (an integer YEAR), so an ISO date like 2023-01-01 would be rejected.
	if _, err := fmt.Fprintln(f, "author_1,author_2,date,metadata"); err != nil {
		return err
	}
	for i := 0; i < edges; i++ {
		a := rand.Intn(authors)
		b := rand.Intn(authors)
		if a == b {
			b = (b + 1) % authors
		}
		// Columns: author1 email, author2 email, year (int), metadata (optional).
		// Year 2024 stays within the relationship detector's default 4-year window.
		_, err := fmt.Fprintf(f, "bench-reviewer-%d@example.com,bench-reviewer-%d@example.com,2024,\n", a, b)
		if err != nil {
			return err
		}
	}
	return nil
}
```

> NOTE (resolved): Verified against `scripts/graph_ingestion/main.go`, its `example_data.csv`, and the backend `Makefile`. Findings baked into the code above:
> - **CSV header/columns:** `author_1,author_2,date,metadata` — author1 email, author2 email, `date` as an **integer year** (parsed via `strconv.Atoi`, so `2023-01-01` would be skipped as invalid), and an optional `metadata` column. Header is skipped by default (`-skip-header=true`).
> - **Loader location:** the loader lives at `backend/scripts/graph_ingestion` (its own Go module `github.com/dcao/conferencespace/tools/graph_ingestion`), NOT `backend/tools/graph_ingestion`. The Makefile `graph-import` target `cd tools/graph_ingestion` and is **broken in this repo** (no such directory), so we invoke the loader directly with `go run .` from `scripts/graph_ingestion` instead of `make graph-import`.
> - **Flags:** `-file` (required), `-uri`, `-user`, `-pass`, `-batch` (default 1000), `-clear`, `-skip-header` (default true). Neo4j connection is configured **via these flags, not env vars** — the loader does not read `NEO4J_*`, so the env-var approach has been removed.
> Author emails reuse `bench-reviewer-%d@example.com` so graph nodes line up with seeded reviewer emails, making graph-based COI hits possible (the micro-bench's `GenCOIInputs` uses a different email scheme — see Task 8 note).

- [ ] **Step 2: Build to verify it compiles**

Run: `cd backend && go build ./benchmarks/seed`
Expected: builds cleanly (now that `seedGraph` is defined).

- [ ] **Step 3: Smoke test (manual, requires Neo4j)**

Run (with Neo4j up): `cd backend && go run ./benchmarks/seed --graph-only --authors 50 --coauthor-edges 200`
Expected: prints loader output then `graph seed complete`. Verify with `make neo4j-status`.

- [ ] **Step 4: Commit**

```bash
git add backend/benchmarks/seed/graph.go
git commit -m "feat(bench): seed synthetic co-authorship graph into Neo4j"
```

---

## Task 8: Optional graph-based COI micro-benchmark

**Files:**
- Create: `backend/benchmarks/micro/coi_graph_bench_test.go`

- [ ] **Step 1: Write the Neo4j-guarded benchmark**

```go
package micro

import (
	"context"
	"os"
	"testing"

	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
	"github.com/dcao/conferencespace/internal/clients/neo4j"
)

// BenchmarkCOI_Graph requires a running Neo4j with a seeded co-authorship graph.
// It skips unless BENCH_NEO4J=1 is set, so the default `go test` run stays hermetic.
func BenchmarkCOI_Graph(b *testing.B) {
	if os.Getenv("BENCH_NEO4J") != "1" {
		b.Skip("set BENCH_NEO4J=1 (and seed the graph) to run the graph COI benchmark")
	}

	uri := envOrDefault("NEO4J_URI", "bolt://localhost:7687")
	user := envOrDefault("NEO4J_USER", "neo4j")
	pass := envOrDefault("NEO4J_PASS", "conferencespace")

	client, err := neo4j.NewClient(neo4j.Config{
		URI:      uri,
		Username: user,
		Password: pass,
	})
	if err != nil {
		b.Fatalf("connect neo4j: %v", err)
	}
	defer client.Close(context.Background())

	det := detectors.NewRelationshipDetector(client, detectors.DefaultCOIWindowYears)
	subs, revs := GenCOIInputs(200, 200, 0.5)
	ctx := context.Background()

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, err := det.DetectConflicts(ctx, subs, revs); err != nil {
			b.Fatalf("DetectConflicts failed: %v", err)
		}
	}
}

func envOrDefault(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
```

> NOTE (resolved): Signatures verified against source. `neo4j.NewClient(cfg neo4j.Config) (*neo4j.Client, error)` takes a `neo4j.Config{URI, Username, Password}` struct (NOT three positional strings); `(*neo4j.Client).Close(ctx context.Context) error` takes a context (so `client.Close(context.Background())` is correct). `detectors.NewRelationshipDetector(client *neo4j.Client, windowYears int) ConflictDetector` returns the `ConflictDetector` interface, and `detectors.DefaultCOIWindowYears == 4`. The benchmark only calls `DetectConflicts`, which is part of the `ConflictDetector` interface, so no type assertion to `*detectors.RelationshipDetector` is needed (that assertion is only used in `controller.go` to call `SetWindowYears`). Remaining caveat: `GenCOIInputs` reviewer emails use `reviewer-%d@example.com` while the graph seed uses `bench-reviewer-%d@example.com`, so unless you align them this benchmark measures query latency over a sparse/empty match set rather than many graph hits — acceptable for a latency benchmark, but document it in the report.

- [ ] **Step 2: Build to verify it compiles**

Run: `cd backend && go test ./benchmarks/micro -run=^$ -bench=BenchmarkCOI_Graph -benchtime=1x`
Expected: prints `--- SKIP: BenchmarkCOI_Graph` (because `BENCH_NEO4J` is unset) and exits 0.

- [ ] **Step 3: Commit**

```bash
git add backend/benchmarks/micro/coi_graph_bench_test.go
git commit -m "feat(bench): add optional Neo4j graph COI micro-benchmark"
```

---

## Task 9: k6 shared library (config + auth)

**Files:**
- Create: `backend/benchmarks/k6/lib/config.js`
- Create: `backend/benchmarks/k6/lib/auth.js`

- [ ] **Step 1: Write `config.js`**

```javascript
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
export const VUS = parseInt(__ENV.VUS || '20', 10);
export const DURATION = __ENV.DURATION || '30s';

// Standard k6 options reused by each scenario. Thresholds are report-only:
// abortOnFail is false so a run always completes and emits full data.
export function baseOptions() {
  return {
    vus: VUS,
    duration: DURATION,
    thresholds: {
      http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: false }],
      http_req_duration: [{ threshold: 'p(95)<2000', abortOnFail: false }],
    },
  };
}
```

- [ ] **Step 2: Write `auth.js`**

```javascript
import http from 'k6/http';
import { BASE_URL } from './config.js';

// getToken returns a JWT: uses AUTH_TOKEN if provided, else bootstraps via test-login.
export function getToken() {
  if (__ENV.AUTH_TOKEN) {
    return __ENV.AUTH_TOKEN;
  }
  const payload = JSON.stringify({
    email: 'bench-chair@example.com',
    first_name: 'Bench',
    last_name: 'User',
  });
  const res = http.post(`${BASE_URL}/api/v1/auth/test-login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status !== 200) {
    throw new Error(`test-login failed (${res.status}): ${res.body}`);
  }
  return JSON.parse(res.body).data.token;
}

export function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
}
```

- [ ] **Step 3: Verify lib parses (syntax check via a trivial run)**

Run: `cd backend/benchmarks && k6 run -e BASE_URL=http://localhost:8080 --vus 1 --iterations 1 - <<'EOF'
import { getToken } from './k6/lib/auth.js';
export default function () { /* import-only syntax check */ }
EOF`
Expected: k6 starts and completes 1 iteration with no import/syntax errors. (Requires the server up for any real call; this check only validates imports.)

- [ ] **Step 4: Commit**

```bash
git add backend/benchmarks/k6/lib/config.js backend/benchmarks/k6/lib/auth.js
git commit -m "feat(bench): add k6 shared config and auth bootstrap"
```

---

## Task 10: k6 CRUD load test

**Files:**
- Create: `backend/benchmarks/k6/crud.js`

- [ ] **Step 1: Write `crud.js`**

```javascript
import http from 'k6/http';
import { check, group } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { BASE_URL, baseOptions } from './lib/config.js';
import { getToken, authHeaders } from './lib/auth.js';

export const options = baseOptions();

export function setup() {
  return { token: getToken() };
}

export default function (data) {
  const h = authHeaders(data.token);

  group('list conferences', () => {
    const res = http.get(`${BASE_URL}/api/v1/conferences?limit=20&offset=0`, h);
    check(res, { 'conferences 200': (r) => r.status === 200 });
  });

  group('search users', () => {
    // `q` is the required query param (matches against user email); `limit`
    // (<=50) and `conference_id` (match annotation) are optional.
    const res = http.get(`${BASE_URL}/api/v1/users/search?q=bench&limit=20`, h);
    check(res, { 'users 200': (r) => r.status === 200 });
  });
}

export function handleSummary(data) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const m = data.metrics;
  const csv = [
    'metric,value',
    `http_reqs,${m.http_reqs ? m.http_reqs.values.count : 0}`,
    `req_per_sec,${m.http_reqs ? m.http_reqs.values.rate : 0}`,
    `error_rate,${m.http_req_failed ? m.http_req_failed.values.rate : 0}`,
    `p50_ms,${m.http_req_duration ? m.http_req_duration.values.med : 0}`,
    `p90_ms,${m.http_req_duration ? m.http_req_duration.values['p(90)'] : 0}`,
    `p95_ms,${m.http_req_duration ? m.http_req_duration.values['p(95)'] : 0}`,
    `p99_ms,${m.http_req_duration ? m.http_req_duration.values['p(99)'] : 0}`,
  ].join('\n');
  const out = {};
  out[`benchmarks/results/crud-${ts}.summary.csv`] = csv;
  out['stdout'] = textSummary(data, { indent: ' ', enableColors: false });
  return out;
}
```

> NOTE (resolved): `ctrl.User.Search` requires the **`q`** query param (returns 400 "search query is required" without it) and matches it against user email. `limit` is optional (capped at 50). `conference_id` is **optional** — when present it annotates each result with match evidence; it is NOT required. The request above sends `q=bench`, so a healthy server returns 200.

- [ ] **Step 2: Run against a seeded dev server**

Run: `cd backend && k6 run -e BASE_URL=http://localhost:8080 benchmarks/k6/crud.js`
Expected: completes, prints summary, writes `benchmarks/results/crud-<ts>.summary.csv`.

- [ ] **Step 3: Commit**

```bash
git add backend/benchmarks/k6/crud.js
git commit -m "feat(bench): add k6 CRUD load test with CSV summary"
```

---

## Task 11: k6 matching load test

**Files:**
- Create: `backend/benchmarks/k6/matching.js`

- [ ] **Step 1: Write `matching.js`**

```javascript
import http from 'k6/http';
import { check } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { BASE_URL, baseOptions } from './lib/config.js';
import { getToken, authHeaders } from './lib/auth.js';

export const options = baseOptions();

// Reads the seed summary (passed via -e SEED_SUMMARY=<json string>) for a real
// conference ID, falling back to CONF_ID env, else 1.
function conferenceID() {
  if (__ENV.CONF_ID) return __ENV.CONF_ID;
  if (__ENV.SEED_SUMMARY) {
    try {
      const ids = JSON.parse(__ENV.SEED_SUMMARY).conference_ids;
      if (ids && ids.length) return String(ids[0]);
    } catch (e) { /* ignore */ }
  }
  return '1';
}

export function setup() {
  return { token: getToken(), confID: conferenceID() };
}

export default function (data) {
  const h = authHeaders(data.token);
  const res = http.get(`${BASE_URL}/api/v1/conferences/${data.confID}/reviewer-suggestions`, h);
  check(res, { 'suggestions resolved': (r) => r.status === 200 || r.status === 403 });
}

export function handleSummary(data) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const m = data.metrics;
  const csv = [
    'metric,value',
    `http_reqs,${m.http_reqs ? m.http_reqs.values.count : 0}`,
    `req_per_sec,${m.http_reqs ? m.http_reqs.values.rate : 0}`,
    `error_rate,${m.http_req_failed ? m.http_req_failed.values.rate : 0}`,
    `p50_ms,${m.http_req_duration ? m.http_req_duration.values.med : 0}`,
    `p95_ms,${m.http_req_duration ? m.http_req_duration.values['p(95)'] : 0}`,
    `p99_ms,${m.http_req_duration ? m.http_req_duration.values['p(99)'] : 0}`,
  ].join('\n');
  const out = {};
  out[`benchmarks/results/matching-${ts}.summary.csv`] = csv;
  out['stdout'] = textSummary(data, { indent: ' ', enableColors: false });
  return out;
}
```

> NOTE: `reviewer-suggestions` requires a chair role on the conference (`requireChair`). The bootstrapped `test-login` user must be that conference's chair. Since the seed tool creates conferences with the same `bench-chair@example.com` token, this holds when seed and k6 use the same email. The check accepts 403 so a role mismatch does not abort; investigate any 403 before trusting the numbers. To benchmark `auto-assign` instead (a POST), confirm its request body shape from `ctrl.Assignment.AutoAssign` and swap the call.

- [ ] **Step 2: Run against a seeded dev server**

Run: `cd backend && k6 run -e BASE_URL=http://localhost:8080 -e CONF_ID=<seeded-id> benchmarks/k6/matching.js`
Expected: completes and writes `benchmarks/results/matching-<ts>.summary.csv`.

- [ ] **Step 3: Commit**

```bash
git add backend/benchmarks/k6/matching.js
git commit -m "feat(bench): add k6 reviewer-matching load test"
```

---

## Task 12: k6 COI load test

**Files:**
- Create: `backend/benchmarks/k6/coi.js`

- [ ] **Step 1: Write `coi.js`**

```javascript
import http from 'k6/http';
import { check } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { BASE_URL, baseOptions } from './lib/config.js';
import { getToken, authHeaders } from './lib/auth.js';

export const options = baseOptions();

// Resolves a real conference ID from the seed summary (-e SEED_SUMMARY=<json>),
// falling back to CONF_ID, else 1. coi/check requires conference_id and the
// caller must be a chair/co-chair of that conference.
function conferenceID() {
  if (__ENV.CONF_ID) return __ENV.CONF_ID;
  if (__ENV.SEED_SUMMARY) {
    try {
      const ids = JSON.parse(__ENV.SEED_SUMMARY).conference_ids;
      if (ids && ids.length) return String(ids[0]);
    } catch (e) { /* ignore */ }
  }
  return '1';
}

export function setup() {
  return { token: getToken(), confID: conferenceID() };
}

export default function (data) {
  const h = authHeaders(data.token);
  // Exercises the full COI check path (incl. Neo4j when a graph is loaded).
  // conference_id is a REQUIRED query param; reviewer_id (path) must be a real
  // reviewer entity ID for a meaningful result.
  const reviewerID = __ENV.REVIEWER_ID || '1';
  const authorEmail = __ENV.AUTHOR_EMAIL || 'bench-reviewer-2@example.com';
  const path = `/api/v1/coi/check/reviewer/${reviewerID}/author/${encodeURIComponent(authorEmail)}?conference_id=${data.confID}`;
  const res = http.get(`${BASE_URL}${path}`, h);
  // 200 = report returned; the run is report-only so transient non-200s
  // (e.g. 403 if the token is not this conference's chair) do not abort it.
  check(res, { 'coi check 200': (r) => r.status === 200 });
}

export function handleSummary(data) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const m = data.metrics;
  const csv = [
    'metric,value',
    `http_reqs,${m.http_reqs ? m.http_reqs.values.count : 0}`,
    `req_per_sec,${m.http_reqs ? m.http_reqs.values.rate : 0}`,
    `error_rate,${m.http_req_failed ? m.http_req_failed.values.rate : 0}`,
    `p50_ms,${m.http_req_duration ? m.http_req_duration.values.med : 0}`,
    `p95_ms,${m.http_req_duration ? m.http_req_duration.values['p(95)'] : 0}`,
    `p99_ms,${m.http_req_duration ? m.http_req_duration.values['p(99)'] : 0}`,
  ].join('\n');
  const out = {};
  out[`benchmarks/results/coi-${ts}.summary.csv`] = csv;
  out['stdout'] = textSummary(data, { indent: ' ', enableColors: false });
  return out;
}
```

> NOTE (resolved): `GET /api/v1/coi/check/reviewer/:reviewer_id/author/:author_email` (`ctrl.COI.CheckReviewerAuthorCOI`) requires:
> - **Auth:** JWT (the `/coi` group uses `AuthMiddleware`).
> - **Query:** `conference_id` is **required** (400 "conference_id query parameter is required" if missing) — now passed above.
> - **Role:** the caller must be a **chair/co-chair of that conference** (`requireConferenceAccess` -> 403 otherwise), unless an admin token is used. The bootstrapped `bench-chair@example.com` is the chair of seeded conferences, so this holds when the seed and k6 share that email/conference.
> - **Path params:** `reviewer_id` (int, must be a real reviewer entity ID for a non-empty report) and `author_email`.
> Remaining genuine unknown: the HTTP seed only records reviewer *emails*, not reviewer entity IDs, so a meaningful `REVIEWER_ID` must be supplied out-of-band (or the seed extended to create reviewer rows). With `reviewer_id=1` the endpoint still exercises the full query/Neo4j path for latency, which is the benchmark's purpose.

- [ ] **Step 2: Run against a seeded dev server**

Run: `cd backend && k6 run -e BASE_URL=http://localhost:8080 benchmarks/k6/coi.js`
Expected: completes and writes `benchmarks/results/coi-<ts>.summary.csv`.

- [ ] **Step 3: Commit**

```bash
git add backend/benchmarks/k6/coi.js
git commit -m "feat(bench): add k6 COI check load test"
```

---

## Task 13: Orchestration script

**Files:**
- Create: `backend/benchmarks/run.sh`

- [ ] **Step 1: Write `run.sh`**

```bash
#!/usr/bin/env bash
# Runs the full benchmark suite against $BASE_URL and collects raw results.
set -euo pipefail

cd "$(dirname "$0")/.."   # -> backend/

# Load .env if present
if [ -f benchmarks/.env ]; then
  set -a; . benchmarks/.env; set +a
fi

BASE_URL="${BASE_URL:-http://localhost:8080}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="benchmarks/results/run-${STAMP}"
mkdir -p "$OUT"

echo "==> Seeding Postgres app data"
go run ./benchmarks/seed \
  --conferences "${SEED_CONFERENCES:-1}" \
  --reviewers "${SEED_REVIEWERS:-200}" \
  --submissions "${SEED_SUBMISSIONS:-500}"

SEED_SUMMARY_JSON="$(cat benchmarks/results/seed-summary.json)"

if [ "${SEED_GRAPH:-0}" = "1" ]; then
  echo "==> Seeding Neo4j co-authorship graph"
  go run ./benchmarks/seed --graph-only \
    --authors "${SEED_AUTHORS:-500}" \
    --coauthor-edges "${SEED_COAUTHOR_EDGES:-4000}"
fi

for script in crud matching coi; do
  echo "==> k6 ${script}"
  k6 run \
    -e "BASE_URL=${BASE_URL}" \
    -e "SEED_SUMMARY=${SEED_SUMMARY_JSON}" \
    --out "json=${OUT}/${script}.json" \
    "benchmarks/k6/${script}.js" || echo "k6 ${script} returned non-zero (thresholds report-only)"
done

echo "==> Go micro-benchmarks"
go test ./benchmarks/micro -bench=. -benchmem -run='^$' -count=5 | tee "${OUT}/micro.txt"

echo "==> Done. Raw results in ${OUT} and benchmarks/results/*.summary.csv"
```

- [ ] **Step 2: Make executable and verify it parses**

Run: `chmod +x backend/benchmarks/run.sh && bash -n backend/benchmarks/run.sh`
Expected: no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add backend/benchmarks/run.sh
git commit -m "feat(bench): add run.sh orchestration for the full suite"
```

---

## Task 14: Final integration verification

- [ ] **Step 1: Full micro-benchmark run compiles and produces data**

Run: `cd backend && go test ./benchmarks/micro -bench=. -benchmem -run='^$' -count=1`
Expected: all `BenchmarkCOI_*` and `BenchmarkMatching_*` report timings; `BenchmarkCOI_Graph` SKIPs.

- [ ] **Step 2: Vet and build the whole benchmark tree**

Run: `cd backend && go vet ./benchmarks/... && go build ./benchmarks/...`
Expected: no errors.

- [ ] **Step 3: End-to-end smoke (manual, requires `make dev`)**

Run: `cd backend && SEED_REVIEWERS=20 SEED_SUBMISSIONS=10 VUS=5 DURATION=10s ./benchmarks/run.sh`
Expected: seed succeeds, three k6 scripts complete, micro-bench output written under `benchmarks/results/run-<stamp>/`.

- [ ] **Step 4: Commit any fixes discovered during integration**

```bash
git add -A backend/benchmarks
git commit -m "fix(bench): integration fixes from end-to-end smoke run"
```

---

## Self-Review Notes (gaps to resolve during implementation)

All four originally-flagged verification points have been **resolved against the
real source** and the code above updated accordingly:

1. **Submission create payload** (Task 6) — RESOLVED. Endpoint is multipart/form-data
   with the payload in a `submission` field (`{"submission":{...}}`); `draft` status
   needs no file. Submissions must be authored by distinct non-admin users (the chair
   is rejected with 403, and each author may submit once per conference), so the seed
   mints `bench-author-i-s@example.com` per submission. Conference payload uses
   `title`+`acronym` (required), wrapped `{"conference":{...}}`, defaulting to status
   `open`. A `doMultipart` helper was added to the seed HTTP client.
2. **Graph CSV header & loader invocation** (Task 7) — RESOLVED. Header is
   `author_1,author_2,date,metadata` with `date` an integer year; the loader lives at
   `scripts/graph_ingestion` (its own module), is invoked via `go run .` with
   `-file/-uri/-user/-pass/-clear` flags (connection is flag-based, not env-based).
   Note: the Makefile `graph-import` target points at the nonexistent
   `tools/graph_ingestion` and is broken, so it is intentionally not used.
3. **`neo4j.NewClient` / `RelationshipDetector` signatures** (Task 8) — RESOLVED.
   `NewClient(neo4j.Config{URI,Username,Password})`; `Close(ctx)`;
   `NewRelationshipDetector(*neo4j.Client, int) ConflictDetector` (interface, so
   `DetectConflicts` is called directly, no type assertion); `DefaultCOIWindowYears = 4`.
4. **`/users/search` and `coi/check` params & roles** (Tasks 10, 12) — RESOLVED.
   `/users/search` requires `q` (not `conference_id`). `coi/check` requires the
   `conference_id` query param and chair/co-chair access to that conference.

**Remaining genuine unknown:** the HTTP seed records reviewer *emails* only, not
reviewer entity IDs, so the k6 `coi/check` script needs a real `REVIEWER_ID` supplied
out-of-band (or the seed extended to create reviewer rows) for a non-empty report;
with the default it still exercises the full query path for latency measurement.

Every spec section maps to a task: scaffold/config/README → T1; micro-benchmarks (matching, COI, graph) → T2–T4, T8; HTTP seed → T5–T6; graph seed → T7; k6 lib + 3 scripts → T9–T12; run orchestration → T13; verification → T14.
