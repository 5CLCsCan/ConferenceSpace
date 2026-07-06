package quality

import (
	"testing"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/matching"
	"github.com/dcao/conferencespace/internal/assignment/scoring"
)

func smallScenario() ([]scoring.Submission, []scoring.Reviewer, scoring.ScoreMatrix, commons.ConflictMap) {
	subs := []scoring.Submission{{ID: 10}, {ID: 20}}
	revs := []scoring.Reviewer{{ID: 1}, {ID: 2}, {ID: 3}}
	scorer := scoring.NewDomainJaccardScorer()
	// Give reviewers/subs domains so scores are non-trivial.
	subs[0].Domain = []string{"nlp"}
	subs[1].Domain = []string{"vision"}
	revs[0].Domain = []string{"nlp"}
	revs[1].Domain = []string{"vision"}
	revs[2].Domain = []string{"graph"}
	matrix, _ := scorer.ComputeMatrix(nil, subs, revs)
	conflicts := commons.ConflictMap{}
	conflicts.AddConflict(10, 1) // reviewer 1 conflicts with paper 10
	return subs, revs, matrix, conflicts
}

func cfg2() matching.MatchConfig {
	cap := 5
	return matching.MatchConfig{
		MinReviewersPerPaper: 1,
		MaxReviewersPerPaper: 2,
		MaxPapersPerReviewer: &cap,
		MinScoreThreshold:    0,
	}
}

func assertNoCOI(t *testing.T, res *matching.MatchResult, conflicts commons.ConflictMap) {
	t.Helper()
	for _, a := range res.Assignments {
		if conflicts.HasConflict(a.SubmissionID, a.ReviewerID) {
			t.Fatalf("COI violation: paper %d reviewer %d", a.SubmissionID, a.ReviewerID)
		}
	}
}

func TestGreedyAssignerRespectsCOI(t *testing.T) {
	subs, revs, matrix, conflicts := smallScenario()
	res := GreedyAssigner(subs, revs, matrix, conflicts, cfg2())
	if res == nil || len(res.Assignments) == 0 {
		t.Fatal("greedy produced no assignments")
	}
	assertNoCOI(t, res, conflicts)
}

func TestRandomAssignerRespectsCOIAndDeterministic(t *testing.T) {
	subs, revs, matrix, conflicts := smallScenario()
	a := RandomAssigner(benchSeed)(subs, revs, matrix, conflicts, cfg2())
	b := RandomAssigner(benchSeed)(subs, revs, matrix, conflicts, cfg2())
	assertNoCOI(t, a, conflicts)
	if len(a.Assignments) != len(b.Assignments) {
		t.Fatalf("random assigner not deterministic: %d vs %d", len(a.Assignments), len(b.Assignments))
	}
}

func TestRoundRobinRespectsLoadCap(t *testing.T) {
	subs, revs, matrix, conflicts := smallScenario()
	cap := 1
	cfg := matching.MatchConfig{MinReviewersPerPaper: 1, MaxReviewersPerPaper: 1, MaxPapersPerReviewer: &cap}
	res := RoundRobinAssigner(subs, revs, matrix, conflicts, cfg)
	assertNoCOI(t, res, conflicts)
	load := map[int64]int{}
	for _, a := range res.Assignments {
		load[a.ReviewerID]++
	}
	for rid, l := range load {
		if l > cap {
			t.Fatalf("reviewer %d over cap: %d > %d", rid, l, cap)
		}
	}
}
