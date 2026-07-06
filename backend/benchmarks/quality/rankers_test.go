package quality

import (
	"testing"

	"github.com/dcao/conferencespace/internal/assignment/scoring"
)

func testReviewers() []scoring.Reviewer {
	return []scoring.Reviewer{
		{ID: 1, Domain: []string{"nlp", "translation"}},
		{ID: 2, Domain: []string{"vision", "segmentation"}},
		{ID: 3, Domain: []string{"graph", "networks"}},
	}
}

func TestJaccardRankerOrdersByScoreThenID(t *testing.T) {
	got := JaccardRanker([]string{"nlp", "translation"}, testReviewers())
	// Reviewer 1 fully overlaps -> rank 1; 2 and 3 tie at 0 -> ordered by ID.
	want := []int64{1, 2, 3}
	if len(got) != 3 || got[0] != want[0] || got[1] != want[1] || got[2] != want[2] {
		t.Fatalf("JaccardRanker = %v, want %v", got, want)
	}
}

func TestOverlapCountRanker(t *testing.T) {
	revs := []scoring.Reviewer{
		{ID: 1, Domain: []string{"nlp"}},                         // overlap 1, small union
		{ID: 2, Domain: []string{"nlp", "translation", "extra"}}, // overlap 2, big union
	}
	// Overlap count ranks reviewer 2 first (2 > 1), unlike Jaccard which would
	// penalize reviewer 2's larger union.
	got := OverlapCountRanker([]string{"nlp", "translation"}, revs)
	if got[0] != 2 {
		t.Fatalf("OverlapCountRanker first = %d, want 2", got[0])
	}
}

func TestRandomRankerDeterministic(t *testing.T) {
	r := RandomRanker(benchSeed)
	a := r(nil, testReviewers())
	b := r(nil, testReviewers())
	if len(a) != 3 {
		t.Fatalf("random ranker returned %d ids", len(a))
	}
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("random ranker not deterministic: %v vs %v", a, b)
		}
	}
}

func TestEvaluateRanker(t *testing.T) {
	revs := testReviewers()
	queries := []RankingQuery{
		{Topics: []string{"nlp", "translation"}, TrueReviewerID: 1}, // rank 1
		{Topics: []string{"graph", "networks"}, TrueReviewerID: 3},  // rank 1
	}
	m := EvaluateRanker(JaccardRanker, queries, revs)
	if m.NumQueries != 2 {
		t.Fatalf("NumQueries = %d, want 2", m.NumQueries)
	}
	if m.HitAt1 != 1.0 || m.MRR != 1.0 {
		t.Fatalf("HitAt1=%v MRR=%v, want 1.0/1.0", m.HitAt1, m.MRR)
	}
}
