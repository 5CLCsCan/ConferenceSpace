package quality

import (
	"context"
	"math/rand"
	"sort"

	"github.com/dcao/conferencespace/internal/assignment/scoring"
)

// Ranker produces a ranked list of reviewer IDs (best first) for a query.
type Ranker func(queryTopics []string, reviewers []scoring.Reviewer) []int64

type scoredReviewer struct {
	id    int64
	score float64
}

// sortByScoreThenID sorts descending by score, breaking ties by ascending ID so
// results are deterministic.
func sortByScoreThenID(arr []scoredReviewer) []int64 {
	sort.SliceStable(arr, func(i, j int) bool {
		if arr[i].score != arr[j].score {
			return arr[i].score > arr[j].score
		}
		return arr[i].id < arr[j].id
	})
	out := make([]int64, len(arr))
	for i := range arr {
		out[i] = arr[i].id
	}
	return out
}

// JaccardRanker ranks reviewers using the production DomainJaccardScorer.
func JaccardRanker(queryTopics []string, reviewers []scoring.Reviewer) []int64 {
	scorer := scoring.NewDomainJaccardScorer()
	sub := scoring.Submission{ID: 0, Domain: queryTopics}
	arr := make([]scoredReviewer, len(reviewers))
	for i, r := range reviewers {
		s, _ := scorer.ComputeScore(context.Background(), sub, r)
		arr[i] = scoredReviewer{id: r.ID, score: s}
	}
	return sortByScoreThenID(arr)
}

// OverlapCountRanker ranks by raw intersection size (no union normalization).
// It is a baseline to show whether Jaccard's normalization helps.
func OverlapCountRanker(queryTopics []string, reviewers []scoring.Reviewer) []int64 {
	q := make(map[string]bool, len(queryTopics))
	for _, t := range queryTopics {
		q[t] = true
	}
	arr := make([]scoredReviewer, len(reviewers))
	for i, r := range reviewers {
		count := 0
		for _, d := range r.Domain {
			if q[d] {
				count++
			}
		}
		arr[i] = scoredReviewer{id: r.ID, score: float64(count)}
	}
	return sortByScoreThenID(arr)
}

// RandomRanker returns a Ranker that deterministically shuffles reviewer IDs.
func RandomRanker(seed int64) Ranker {
	return func(_ []string, reviewers []scoring.Reviewer) []int64 {
		ids := make([]int64, len(reviewers))
		for i, r := range reviewers {
			ids[i] = r.ID
		}
		rng := rand.New(rand.NewSource(seed))
		rng.Shuffle(len(ids), func(i, j int) { ids[i], ids[j] = ids[j], ids[i] })
		return ids
	}
}

// RankingQuery is one leave-one-out query: the held-out paper's topics and the
// true author (the one relevant reviewer).
type RankingQuery struct {
	Topics         []string
	TrueReviewerID int64
}

// RankingMetrics aggregates ranking quality across all queries.
type RankingMetrics struct {
	HitAt1     float64
	HitAt5     float64
	HitAt10    float64
	MRR        float64
	NDCG10     float64
	NumQueries int
}

// rankOf returns the 1-based position of target in ids, or 0 if absent.
func rankOf(ids []int64, target int64) int {
	for i, id := range ids {
		if id == target {
			return i + 1
		}
	}
	return 0
}

// EvaluateRanker runs a ranker over all queries and computes ranking metrics.
func EvaluateRanker(ranker Ranker, queries []RankingQuery, reviewers []scoring.Reviewer) RankingMetrics {
	ranks := make([]int, len(queries))
	for i, q := range queries {
		ranks[i] = rankOf(ranker(q.Topics, reviewers), q.TrueReviewerID)
	}
	return RankingMetrics{
		HitAt1:     HitAtK(ranks, 1),
		HitAt5:     HitAtK(ranks, 5),
		HitAt10:    HitAtK(ranks, 10),
		MRR:        MRR(ranks),
		NDCG10:     NDCGAtK(ranks, 10),
		NumQueries: len(queries),
	}
}
