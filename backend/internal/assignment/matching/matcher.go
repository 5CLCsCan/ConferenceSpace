package matching

import (
	"context"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/scoring"
)

// AssignmentMatcher defines the interface for assignment algorithms
type AssignmentMatcher interface {
	// Match performs the assignment algorithm
	Match(ctx context.Context, input MatchInput) (*MatchResult, error)

	// Name returns the matcher's identifier
	Name() string
}

// MatchInput contains all data needed for matching
type MatchInput struct {
	Submissions []Submission
	Reviewers   []Reviewer
	Scores      scoring.ScoreMatrix
	Conflicts   commons.ConflictChecker
	Config      MatchConfig
}

// Submission represents submission data for matching
type Submission struct {
	ID int64
}

// Reviewer represents reviewer data for matching
type Reviewer struct {
	ID int64
}

// MatchConfig contains configuration for the matching algorithm
type MatchConfig struct {
	MinReviewersPerPaper int
	MaxReviewersPerPaper int
	MaxPapersPerReviewer *int    // nil = auto-calculate
	MinScoreThreshold    float64 // Minimum similarity score to allow assignment
}

// MatchResult contains the results of the matching algorithm
type MatchResult struct {
	Assignments         []Assignment
	UnassignedPapers    []int64       // Papers that couldn't meet MinReviewersPerPaper (may still have 1+ reviewer)
	FallbackAssignments []int64       // Paper IDs that were assigned via fallback (relaxed constraints)
	ReviewerLoadMap     map[int64]int
	TotalScore          float64
	AverageScore        float64
}

// Assignment represents a reviewer assigned to a submission
type Assignment struct {
	SubmissionID int64
	ReviewerID   int64
	Score        float64
}
