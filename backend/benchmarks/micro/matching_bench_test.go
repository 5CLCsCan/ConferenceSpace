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
