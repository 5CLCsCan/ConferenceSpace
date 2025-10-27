package scoring

import "context"

// SimilarityScorer defines the interface for computing similarity scores
type SimilarityScorer interface {
	// ComputeScore calculates similarity between submission and reviewer
	ComputeScore(ctx context.Context, submission Submission, reviewer Reviewer) (float64, error)

	// ComputeMatrix builds full N×M score matrix
	ComputeMatrix(ctx context.Context, submissions []Submission, reviewers []Reviewer) (ScoreMatrix, error)

	// Name returns the scorer's identifier
	Name() string
}

// Submission represents submission data for scoring
type Submission struct {
	ID       int64
	Title    string
	Abstract string
	Domain   []string
}

// Reviewer represents reviewer data for scoring
type Reviewer struct {
	ID     int64
	Domain []string
}

// ScoreMatrix represents the N×M similarity matrix
type ScoreMatrix []ScoreEntry

// ScoreEntry represents a single score in the matrix
type ScoreEntry struct {
	SubmissionID int64
	ReviewerID   int64
	Score        float64
}

// Sort interface for ScoreMatrix
func (m ScoreMatrix) Len() int           { return len(m) }
func (m ScoreMatrix) Swap(i, j int)      { m[i], m[j] = m[j], m[i] }
func (m ScoreMatrix) Less(i, j int) bool { return m[i].Score > m[j].Score } // Descending order
