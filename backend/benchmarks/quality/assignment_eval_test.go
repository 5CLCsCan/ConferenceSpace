package quality

import (
	"sync"
	"testing"

	"github.com/dcao/conferencespace/internal/assignment/matching"
)

// Shared across the two eval tests to build one combined report. Guarded by a
// mutex since Go may run tests in the same package sequentially but this keeps it
// safe regardless.
var (
	reportMu         sync.Mutex
	reportRanking    []NamedRanking
	reportAssignment []NamedAssignment
	reportStats      FixtureStats
)

func assignmentConfig() matching.MatchConfig {
	return matching.MatchConfig{
		MinReviewersPerPaper: 2,
		MaxReviewersPerPaper: 3,
		MaxPapersPerReviewer: nil, // auto-calculate
		MinScoreThreshold:    0.0,
	}
}

// TestQualityAssignment evaluates the greedy matcher vs. baselines on the
// checked-in snapshot and asserts zero COI violations for greedy.
func TestQualityAssignment(t *testing.T) {
	s, err := LoadSnapshot(defaultSnapshotPath)
	if err != nil {
		t.Fatalf("load snapshot: %v", err)
	}
	sc := BuildAssignmentScenario(s)
	cfg := assignmentConfig()

	greedy := EvaluateAssignment(GreedyAssigner(sc.Submissions, sc.Reviewers, sc.Scores, sc.Conflicts, cfg), sc.Submissions, sc.Reviewers, sc.Scores, sc.Conflicts, cfg)
	random := EvaluateAssignment(RandomAssigner(benchSeed)(sc.Submissions, sc.Reviewers, sc.Scores, sc.Conflicts, cfg), sc.Submissions, sc.Reviewers, sc.Scores, sc.Conflicts, cfg)
	roundRobin := EvaluateAssignment(RoundRobinAssigner(sc.Submissions, sc.Reviewers, sc.Scores, sc.Conflicts, cfg), sc.Submissions, sc.Reviewers, sc.Scores, sc.Conflicts, cfg)

	if greedy.COIViolations != 0 {
		t.Fatalf("greedy produced %d COI violations, want 0", greedy.COIViolations)
	}
	// Greedy should match or beat baselines on mean assigned score.
	if greedy.MeanScore < random.MeanScore {
		t.Fatalf("greedy mean score %.3f < random %.3f", greedy.MeanScore, random.MeanScore)
	}

	reportMu.Lock()
	reportAssignment = []NamedAssignment{
		{Name: "greedy", Metrics: greedy},
		{Name: "round_robin", Metrics: roundRobin},
		{Name: "random", Metrics: random},
	}
	reportMu.Unlock()
}

// TestQualityReport writes the combined Markdown+CSV artifact. Depends on the two
// eval tests having populated the shared report vars (Go runs tests in file order
// within a package: assignment_eval, ranking_eval, then this if named to sort last
// — so recompute defensively here to avoid ordering assumptions).
func TestQualityReport(t *testing.T) {
	s, err := LoadSnapshot(defaultSnapshotPath)
	if err != nil {
		t.Fatalf("load snapshot: %v", err)
	}
	eval := BuildRankingEval(s)
	stats := ComputeFixtureStats(s, eval)

	reportMu.Lock()
	ranking := reportRanking
	assignment := reportAssignment
	reportMu.Unlock()

	if ranking == nil {
		ranking = []NamedRanking{
			{Name: "jaccard", Metrics: EvaluateRanker(JaccardRanker, eval.Queries, eval.Reviewers)},
			{Name: "overlap_count", Metrics: EvaluateRanker(OverlapCountRanker, eval.Queries, eval.Reviewers)},
			{Name: "random", Metrics: EvaluateRanker(RandomRanker(benchSeed), eval.Queries, eval.Reviewers)},
		}
	}
	if assignment == nil {
		sc := BuildAssignmentScenario(s)
		cfg := assignmentConfig()
		assignment = []NamedAssignment{
			{Name: "greedy", Metrics: EvaluateAssignment(GreedyAssigner(sc.Submissions, sc.Reviewers, sc.Scores, sc.Conflicts, cfg), sc.Submissions, sc.Reviewers, sc.Scores, sc.Conflicts, cfg)},
		}
	}

	if err := WriteReport("results", stats, ranking, assignment); err != nil {
		t.Fatalf("WriteReport: %v", err)
	}
	t.Logf("wrote results/quality-results.md and .csv")
}
