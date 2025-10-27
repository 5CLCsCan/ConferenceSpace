package matching

import (
	"context"
	"math"
	"sort"
)

// GreedyMatcher implements a greedy assignment algorithm
type GreedyMatcher struct{}

// NewGreedyMatcher creates a new greedy matcher
func NewGreedyMatcher() *GreedyMatcher {
	return &GreedyMatcher{}
}

// Name returns the matcher identifier
func (m *GreedyMatcher) Name() string {
	return "greedy"
}

// Match performs greedy assignment algorithm
// Algorithm:
// 1. Sort all scores descending
// 2. Greedily assign highest scores first
// 3. Respect constraints (COI, max load, max reviewers per paper)
// 4. Track unassigned papers
func (m *GreedyMatcher) Match(ctx context.Context, input MatchInput) (*MatchResult, error) {
	// Sort scores descending
	scores := make([]Assignment, len(input.Scores))
	for i, entry := range input.Scores {
		scores[i] = Assignment{
			SubmissionID: entry.SubmissionID,
			ReviewerID:   entry.ReviewerID,
			Score:        entry.Score,
		}
	}
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Score > scores[j].Score
	})

	// Initialize trackers
	reviewerLoad := make(map[int64]int)
	submissionCount := make(map[int64]int)
	assignments := []Assignment{}

	// Calculate max load per reviewer
	maxLoad := m.calculateMaxLoad(input)

	// Greedy assignment
	totalScore := 0.0
	for _, entry := range scores {
		// Check COI
		if input.Conflicts.HasConflict(entry.SubmissionID, entry.ReviewerID) {
			continue
		}

		// Check score threshold
		if entry.Score < input.Config.MinScoreThreshold {
			continue
		}

		// Check constraints
		if reviewerLoad[entry.ReviewerID] >= maxLoad {
			continue // Reviewer at max capacity
		}
		if submissionCount[entry.SubmissionID] >= input.Config.MaxReviewersPerPaper {
			continue // Paper has enough reviewers
		}

		// Make assignment
		assignments = append(assignments, entry)
		reviewerLoad[entry.ReviewerID]++
		submissionCount[entry.SubmissionID]++
		totalScore += entry.Score
	}

	// Find unassigned papers
	unassigned := []int64{}
	for _, sub := range input.Submissions {
		if submissionCount[sub.ID] < input.Config.MinReviewersPerPaper {
			unassigned = append(unassigned, sub.ID)
		}
	}

	// Calculate average score
	avgScore := 0.0
	if len(assignments) > 0 {
		avgScore = totalScore / float64(len(assignments))
	}

	return &MatchResult{
		Assignments:      assignments,
		UnassignedPapers: unassigned,
		ReviewerLoadMap:  reviewerLoad,
		TotalScore:       totalScore,
		AverageScore:     avgScore,
	}, nil
}

// calculateMaxLoad computes the maximum number of papers per reviewer
func (m *GreedyMatcher) calculateMaxLoad(input MatchInput) int {
	// If explicitly configured, use it
	if input.Config.MaxPapersPerReviewer != nil {
		return *input.Config.MaxPapersPerReviewer
	}

	// Auto-calculate based on supply and demand
	N := len(input.Submissions)
	M := len(input.Reviewers)

	if M == 0 {
		return 0
	}

	// Total assignments needed
	totalAssignments := N * input.Config.MinReviewersPerPaper

	// Distribute evenly across reviewers, round up
	maxLoad := int(math.Ceil(float64(totalAssignments) / float64(M)))

	// Ensure at least 1 if there are papers
	if maxLoad == 0 && N > 0 {
		maxLoad = 1
	}

	return maxLoad
}
