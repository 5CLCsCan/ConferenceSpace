package detectors

import (
	"context"
	"fmt"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
)

// SelfAuthorDetector prevents authors from reviewing their own papers
type SelfAuthorDetector struct{}

// NewSelfAuthorDetector creates a new self-author detector
func NewSelfAuthorDetector() ConflictDetector {
	return &SelfAuthorDetector{}
}

// Name returns the detector's identifier
func (d *SelfAuthorDetector) Name() string {
	return "self_author"
}

// DetectConflicts finds all cases where an author is also a reviewer
func (d *SelfAuthorDetector) DetectConflicts(
	ctx context.Context,
	submissions []commons.Submission,
	reviewers []commons.Reviewer,
) (commons.ConflictMap, error) {
	conflicts := make(commons.ConflictMap)

	// Build reviewer email map for O(1) lookup
	reviewerByEmail := make(map[string]int64)
	for _, r := range reviewers {
		reviewerByEmail[r.UserEmail] = r.ID
	}

	// Check each submission
	for _, sub := range submissions {
		conflicts[sub.ID] = make(map[int64]bool)

		// Check if author is a reviewer
		if reviewerID, exists := reviewerByEmail[sub.AuthorEmail]; exists {
			conflicts[sub.ID][reviewerID] = true
		}

		// Check if any co-author is a reviewer
		for _, coauthor := range sub.CoAuthors {
			if reviewerID, exists := reviewerByEmail[coauthor]; exists {
				conflicts[sub.ID][reviewerID] = true
			}
		}
	}

	return conflicts, nil
}

// DetectConflictsWithDetails returns detailed conflict information for self-authorship conflicts
func (d *SelfAuthorDetector) DetectConflictsWithDetails(
	ctx context.Context,
	submissions []commons.Submission,
	reviewers []commons.Reviewer,
) ([]commons.ConflictDetail, error) {
	var details []commons.ConflictDetail

	// Build reviewer email map for O(1) lookup
	reviewerByEmail := make(map[string]int64)
	for _, r := range reviewers {
		reviewerByEmail[r.UserEmail] = r.ID
	}

	// Check each submission
	for _, sub := range submissions {
		// Check if primary author is a reviewer
		if reviewerID, exists := reviewerByEmail[sub.AuthorEmail]; exists {
			details = append(details, commons.ConflictDetail{
				SubmissionID: sub.ID,
				ReviewerID:   reviewerID,
				AuthorEmail:  sub.AuthorEmail,
				Type:         "self_author",
				Severity:     "high",
				Description:  fmt.Sprintf("Reviewer is the primary author of this submission"),
				Evidence:     []string{"Primary author match"},
				StartDate:    nil,
				EndDate:      nil,
			})
		}

		// Check if any co-author is a reviewer
		for _, coauthor := range sub.CoAuthors {
			if reviewerID, exists := reviewerByEmail[coauthor]; exists {
				details = append(details, commons.ConflictDetail{
					SubmissionID: sub.ID,
					ReviewerID:   reviewerID,
					AuthorEmail:  coauthor,
					Type:         "self_author",
					Severity:     "high",
					Description:  fmt.Sprintf("Reviewer is a co-author of this submission"),
					Evidence:     []string{"Co-author match"},
					StartDate:    nil,
					EndDate:      nil,
				})
			}
		}
	}

	return details, nil
}

// HasConflict checks if a specific submission-reviewer pair has self-authorship conflict
func (d *SelfAuthorDetector) HasConflict(ctx context.Context, submissionID, reviewerID int64) (bool, error) {
	// This is a simplified version that would need to fetch data
	// In practice, DetectConflicts should be used for batch operations
	return false, nil
}
