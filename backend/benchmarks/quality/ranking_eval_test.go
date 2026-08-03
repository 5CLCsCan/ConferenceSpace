package quality

import "testing"

// TestQualityRanking evaluates reviewer-suggestion ranking quality against the
// checked-in snapshot, asserts Jaccard beats the random floor, and stashes the
// metrics for the shared report (written by TestQualityReport).
func TestQualityRanking(t *testing.T) {
	s, err := LoadSnapshot(defaultSnapshotPath)
	if err != nil {
		t.Fatalf("load snapshot: %v", err)
	}
	eval := BuildRankingEval(s)
	if len(eval.Queries) == 0 {
		t.Fatal("no leave-one-out queries; fixture too small")
	}

	jaccard := EvaluateRanker(JaccardRanker, eval.Queries, eval.Reviewers)
	overlap := EvaluateRanker(OverlapCountRanker, eval.Queries, eval.Reviewers)
	random := EvaluateRanker(RandomRanker(benchSeed), eval.Queries, eval.Reviewers)

	// Discrimination guard. For single-relevant leave-one-out, a uniformly random
	// ranking has expected MRR = H(N)/N (harmonic number over N reviewers), NOT
	// 1/N. Confirm random tracks that theoretical baseline, so the eval is behaving.
	n := len(eval.Reviewers)
	harmonic := 0.0
	for i := 1; i <= n; i++ {
		harmonic += 1.0 / float64(i)
	}
	expectedRandom := harmonic / float64(n)
	if random.MRR > 1.5*expectedRandom {
		t.Fatalf("random MRR %.3f far above theoretical baseline %.3f — RNG or eval bug", random.MRR, expectedRandom)
	}
	// Jaccard must clearly beat random (the whole point of the algorithm).
	if jaccard.MRR <= random.MRR {
		t.Fatalf("jaccard MRR %.3f did not beat random %.3f", jaccard.MRR, random.MRR)
	}

	reportMu.Lock()
	reportRanking = []NamedRanking{
		{Name: "jaccard", Metrics: jaccard},
		{Name: "overlap_count", Metrics: overlap},
		{Name: "random", Metrics: random},
	}
	reportMu.Unlock()
}
