package quality

import (
	"context"
	"math"
	"math/rand"
	"sort"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/matching"
	"github.com/dcao/conferencespace/internal/assignment/scoring"
)

// Assigner allocates reviewers to submissions under COI + load constraints.
type Assigner func(
	subs []scoring.Submission,
	revs []scoring.Reviewer,
	scores scoring.ScoreMatrix,
	conflicts commons.ConflictMap,
	cfg matching.MatchConfig,
) *matching.MatchResult

// maxLoad mirrors the greedy matcher's auto-calculation when no explicit cap is set.
func maxLoad(cfg matching.MatchConfig, numSubs, numRevs int) int {
	if cfg.MaxPapersPerReviewer != nil {
		return *cfg.MaxPapersPerReviewer
	}
	if numRevs == 0 {
		return 0
	}
	return int(math.Ceil(float64(numSubs*cfg.MinReviewersPerPaper) / float64(numRevs)))
}

func toMatchingSubs(subs []scoring.Submission) []matching.Submission {
	out := make([]matching.Submission, len(subs))
	for i, s := range subs {
		out[i] = matching.Submission{ID: s.ID}
	}
	return out
}

func toMatchingRevs(revs []scoring.Reviewer) []matching.Reviewer {
	out := make([]matching.Reviewer, len(revs))
	for i, r := range revs {
		out[i] = matching.Reviewer{ID: r.ID}
	}
	return out
}

// GreedyAssigner wraps the production two-pass greedy matcher.
func GreedyAssigner(
	subs []scoring.Submission,
	revs []scoring.Reviewer,
	scores scoring.ScoreMatrix,
	conflicts commons.ConflictMap,
	cfg matching.MatchConfig,
) *matching.MatchResult {
	m := matching.NewGreedyMatcher()
	res, err := m.Match(context.Background(), matching.MatchInput{
		Submissions: toMatchingSubs(subs),
		Reviewers:   toMatchingRevs(revs),
		Scores:      scores,
		Conflicts:   conflicts,
		Config:      cfg,
	})
	if err != nil {
		return &matching.MatchResult{}
	}
	return res
}

// RandomAssigner returns an Assigner that fills each paper's reviewer slots from a
// deterministic random permutation, respecting COI and the load cap.
func RandomAssigner(seed int64) Assigner {
	return func(
		subs []scoring.Submission,
		revs []scoring.Reviewer,
		_ scoring.ScoreMatrix,
		conflicts commons.ConflictMap,
		cfg matching.MatchConfig,
	) *matching.MatchResult {
		rng := rand.New(rand.NewSource(seed))
		cap := maxLoad(cfg, len(subs), len(revs))
		load := make(map[int64]int)
		var assignments []matching.Assignment
		for _, s := range subs {
			assigned := 0
			for _, idx := range rng.Perm(len(revs)) {
				if assigned >= cfg.MinReviewersPerPaper {
					break
				}
				r := revs[idx]
				if conflicts.HasConflict(s.ID, r.ID) || load[r.ID] >= cap {
					continue
				}
				assignments = append(assignments, matching.Assignment{SubmissionID: s.ID, ReviewerID: r.ID})
				load[r.ID]++
				assigned++
			}
		}
		return &matching.MatchResult{Assignments: assignments, ReviewerLoadMap: load}
	}
}

// RoundRobinAssigner cycles reviewers (sorted by ID) across papers, respecting COI
// and the load cap. Deterministic by construction.
func RoundRobinAssigner(
	subs []scoring.Submission,
	revs []scoring.Reviewer,
	_ scoring.ScoreMatrix,
	conflicts commons.ConflictMap,
	cfg matching.MatchConfig,
) *matching.MatchResult {
	order := make([]int64, len(revs))
	for i, r := range revs {
		order[i] = r.ID
	}
	sort.Slice(order, func(i, j int) bool { return order[i] < order[j] })

	cap := maxLoad(cfg, len(subs), len(revs))
	load := make(map[int64]int)
	var assignments []matching.Assignment
	ptr := 0
	for _, s := range subs {
		assigned, tried := 0, 0
		for assigned < cfg.MinReviewersPerPaper && tried < len(order) && len(order) > 0 {
			rid := order[ptr%len(order)]
			ptr++
			tried++
			if conflicts.HasConflict(s.ID, rid) || load[rid] >= cap {
				continue
			}
			assignments = append(assignments, matching.Assignment{SubmissionID: s.ID, ReviewerID: rid})
			load[rid]++
			assigned++
		}
	}
	return &matching.MatchResult{Assignments: assignments, ReviewerLoadMap: load}
}
