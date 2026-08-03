package matching

import (
	"context"
	"math"
	"sort"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
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
// 4. Fallback pass: ensure every paper gets at least 1 reviewer (relaxed constraints)
// 5. Track papers that still couldn't be assigned (only due to COI conflicts)
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

	// Greedy assignment (Pass 1: strict constraints)
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
		recordAssignment(input.Conflicts, entry.SubmissionID, entry.ReviewerID)
	}

	// Pass 2: Fallback for papers with ZERO reviewers
	// Relax score threshold and max load to ensure at least 1 reviewer per paper
	// Only COI remains as a hard constraint
	papersWithZeroReviewers := []int64{}
	for _, sub := range input.Submissions {
		if submissionCount[sub.ID] == 0 {
			papersWithZeroReviewers = append(papersWithZeroReviewers, sub.ID)
		}
	}

	fallbackAssignments := []int64{} // Track which papers were assigned via fallback

	if len(papersWithZeroReviewers) > 0 {
		// Build a map of scores by submission for quick lookup
		scoresBySubmission := make(map[int64][]Assignment)
		for _, entry := range scores {
			scoresBySubmission[entry.SubmissionID] = append(scoresBySubmission[entry.SubmissionID], entry)
		}

		// For each paper with zero reviewers, find the best available reviewer
		for _, subID := range papersWithZeroReviewers {
			subScores := scoresBySubmission[subID]

			// Sort by score descending (already sorted globally, but let's be safe)
			sort.Slice(subScores, func(i, j int) bool {
				return subScores[i].Score > subScores[j].Score
			})

			// Try to find at least one reviewer, ignoring score threshold and max load constraints
			// COI is the ONLY hard constraint in fallback - we must assign even if reviewer is overloaded
			assigned := false
			for _, entry := range subScores {
				// COI is the only hard constraint - never violate it
				if input.Conflicts.HasConflict(entry.SubmissionID, entry.ReviewerID) {
					continue
				}

				// In fallback pass, we ignore max load completely
				// The core guarantee is: no paper without a reviewer (unless all have COI)

				// Make fallback assignment
				assignments = append(assignments, entry)
				reviewerLoad[entry.ReviewerID]++
				submissionCount[entry.SubmissionID]++
				totalScore += entry.Score
				recordAssignment(input.Conflicts, entry.SubmissionID, entry.ReviewerID)
				fallbackAssignments = append(fallbackAssignments, subID)
				assigned = true
				break // Only need 1 reviewer in fallback pass
			}

			// If still not assigned, it means ALL reviewers have COI - this is a hard failure
			if !assigned {
				// This paper truly cannot be assigned - all reviewers have conflicts
				// It will remain in unassigned list
			}
		}
	}

	// Find papers that still don't meet minimum (includes those with 0 due to COI)
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
		Assignments:         assignments,
		UnassignedPapers:    unassigned,
		FallbackAssignments: fallbackAssignments,
		ReviewerLoadMap:     reviewerLoad,
		TotalScore:          totalScore,
		AverageScore:        avgScore,
	}, nil
}

// calculateMaxLoad computes the maximum number of papers per reviewer
func recordAssignment(conflicts commons.ConflictChecker, submissionID, reviewerID int64) {
	if conflicts == nil {
		return
	}
	if recorder, ok := conflicts.(commons.AssignmentRecorder); ok {
		recorder.RecordAssignment(submissionID, reviewerID)
	}
}

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
