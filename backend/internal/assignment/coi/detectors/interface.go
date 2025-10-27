package detectors

import (
	"context"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
)

// ConflictDetector defines the interface for detecting conflicts of interest
type ConflictDetector interface {
	// DetectConflicts returns a map of (submission_id -> set of conflicted reviewer_ids)
	DetectConflicts(ctx context.Context, submissions []commons.Submission, reviewers []commons.Reviewer) (commons.ConflictMap, error)

	// HasConflict checks if a specific pair has conflict
	HasConflict(ctx context.Context, submissionID, reviewerID int64) (bool, error)

	// Name returns the detector's identifier
	Name() string
}
