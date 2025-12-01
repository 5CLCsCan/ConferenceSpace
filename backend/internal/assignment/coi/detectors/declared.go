package detectors

import (
	"context"
	"fmt"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
)

// DeclaredConflictsDetector uses user-declared conflicts from submissions
type DeclaredConflictsDetector struct{}

// NewDeclaredConflictsDetector creates a new declared conflicts detector
func NewDeclaredConflictsDetector() ConflictDetector {
	return &DeclaredConflictsDetector{}
}

// Name returns the detector's identifier
func (d *DeclaredConflictsDetector) Name() string {
	return "declared_conflicts"
}

// DetectConflicts finds all user-declared conflicts
func (d *DeclaredConflictsDetector) DetectConflicts(
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

	// Check each submission's declared conflicts
	for _, sub := range submissions {
		conflicts[sub.ID] = make(map[int64]bool)

		// Check declared conflicts from submission.information.declared_conflicts
		for _, declared := range sub.Declared {
			if reviewerID, exists := reviewerByEmail[declared.Email]; exists {
				conflicts[sub.ID][reviewerID] = true
			}
		}
	}

	return conflicts, nil
}

// DetectConflictsWithDetails returns detailed conflict information for declared conflicts
func (d *DeclaredConflictsDetector) DetectConflictsWithDetails(
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

	// Check each submission's declared conflicts
	for _, sub := range submissions {
		for _, declared := range sub.Declared {
			if reviewerID, exists := reviewerByEmail[declared.Email]; exists {
				// Use user-provided reason or default description
				description := declared.Reason
				if description == "" {
					description = fmt.Sprintf("Conflict of interest declared by author with %s", declared.Email)
				}

				details = append(details, commons.ConflictDetail{
					SubmissionID: sub.ID,
					ReviewerID:   reviewerID,
					AuthorEmail:  sub.AuthorEmail,
					Type:         "declared",
					Severity:     "high", // Declared conflicts are always high severity
					Description:  description,
					Evidence:     []string{"User-declared conflict"},
					StartDate:    nil,
					EndDate:      nil,
				})
			}
		}
	}

	return details, nil
}

// HasConflict checks if a specific submission-reviewer pair has declared conflict
func (d *DeclaredConflictsDetector) HasConflict(ctx context.Context, submissionID, reviewerID int64) (bool, error) {
	// This is a simplified version that would need to fetch data
	// In practice, DetectConflicts should be used for batch operations
	return false, nil
}
