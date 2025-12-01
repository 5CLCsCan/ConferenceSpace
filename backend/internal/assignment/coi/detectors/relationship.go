package detectors

import (
	"context"
	"fmt"
	"time"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/clients/neo4j"
)

const (
	// DefaultCOIPathThreshold is the maximum number of hops to consider for COI detection
	// 3 hops covers: direct collaboration (1), co-advisor (2), extended network (3)
	DefaultCOIPathThreshold = 3

	// DefaultCOIWindowYears is the default number of years to look back
	DefaultCOIWindowYears = 4
)

// RelationshipDetector detects COI based on collaboration graphs in Neo4j
type RelationshipDetector struct {
	authorService *neo4j.AuthorService
	windowYears   int // How many years back to consider (e.g., 4 means last 4 years)
}

// NewRelationshipDetector creates a new Neo4j-based relationship detector
// Path threshold is hardcoded to 3 hops (technical parameter)
// Window years defaults to 4 but can be configured per conference
func NewRelationshipDetector(
	client *neo4j.Client,
	windowYears int,
) ConflictDetector {
	if windowYears <= 0 {
		windowYears = DefaultCOIWindowYears
	}

	return &RelationshipDetector{
		authorService: neo4j.NewAuthorService(client),
		windowYears:   windowYears,
	}
}

// SetWindowYears updates the window years for this detector
// This allows configuring per conference
func (d *RelationshipDetector) SetWindowYears(years int) {
	if years > 0 {
		d.windowYears = years
	}
}

// GetWindowYears returns the current window years setting
func (d *RelationshipDetector) GetWindowYears() int {
	return d.windowYears
}

// Name returns the detector's identifier
func (d *RelationshipDetector) Name() string {
	return "relationship"
}

// DetectConflicts finds conflicts based on collaboration paths in the graph
func (d *RelationshipDetector) DetectConflicts(
	ctx context.Context,
	submissions []commons.Submission,
	reviewers []commons.Reviewer,
) (commons.ConflictMap, error) {
	conflicts := make(commons.ConflictMap)

	// Calculate year threshold (e.g., current year - 4)
	yearThreshold := time.Now().Year() - d.windowYears

	// Build reviewer email map for quick lookup
	reviewerByEmail := make(map[string]int64)
	for _, r := range reviewers {
		reviewerByEmail[r.UserEmail] = r.ID
	}

	// Check each submission against all reviewers
	for _, sub := range submissions {
		conflicts[sub.ID] = make(map[int64]bool)

		// Collect all authors from the submission (main author + co-authors)
		authors := []string{sub.AuthorEmail}
		authors = append(authors, sub.CoAuthors...)

		// Check each author against each reviewer
		for _, authorEmail := range authors {
			for reviewerEmail, reviewerID := range reviewerByEmail {
				// Check if there's a collaboration path (up to 3 hops)
				hasConflict, err := d.authorService.HasIndirectCollaboration(
					ctx,
					authorEmail,
					reviewerEmail,
					DefaultCOIPathThreshold,
					yearThreshold,
				)

				if err != nil {
					// Log error but continue (don't fail entire detection)
					// In production, you might want to use proper logging
					continue
				}

				if hasConflict {
					conflicts[sub.ID][reviewerID] = true
				}
			}
		}
	}

	return conflicts, nil
}

// HasConflict checks if a specific submission-reviewer pair has a relationship conflict
func (d *RelationshipDetector) HasConflict(
	ctx context.Context,
	submissionID,
	reviewerID int64,
) (bool, error) {
	// This is a simplified version for single-pair checks
	// In practice, you'd need to fetch submission and reviewer data
	// This is mainly used for real-time checks after initial batch detection
	return false, fmt.Errorf("single-pair check not implemented - use DetectConflicts for batch operations")
}

// DetectConflictsWithDetails returns detailed conflict information for relationship-based conflicts
func (d *RelationshipDetector) DetectConflictsWithDetails(
	ctx context.Context,
	submissions []commons.Submission,
	reviewers []commons.Reviewer,
) ([]commons.ConflictDetail, error) {
	var details []commons.ConflictDetail

	// Calculate year threshold
	yearThreshold := time.Now().Year() - d.windowYears

	// Build reviewer email map for quick lookup
	reviewerByEmail := make(map[string]int64)
	for _, r := range reviewers {
		reviewerByEmail[r.UserEmail] = r.ID
	}

	// Check each submission against all reviewers
	for _, sub := range submissions {
		// Collect all authors from the submission (main author + co-authors)
		authors := []string{sub.AuthorEmail}
		authors = append(authors, sub.CoAuthors...)

		// Check each author against each reviewer
		for _, authorEmail := range authors {
			for reviewerEmail, reviewerID := range reviewerByEmail {
				// Check if there's a collaboration path
				hasConflict, err := d.authorService.HasIndirectCollaboration(
					ctx,
					authorEmail,
					reviewerEmail,
					DefaultCOIPathThreshold,
					yearThreshold,
				)

				if err != nil {
					// Log error but continue
					continue
				}

				if hasConflict {
					// For now, infer relationship details
					// In a more sophisticated implementation, you would query Neo4j for path details
					description := fmt.Sprintf("Collaboration detected between %s and %s within the last %d years",
						authorEmail, reviewerEmail, d.windowYears)

					// Assume "collaborator" type and "medium" severity for graph-detected relationships
					// In a real implementation, you would analyze the path to determine type and severity
					details = append(details, commons.ConflictDetail{
						SubmissionID: sub.ID,
						ReviewerID:   reviewerID,
						AuthorEmail:  authorEmail,
						Type:         "collaborator",
						Severity:     "medium",
						Description:  description,
						Evidence:     []string{fmt.Sprintf("Graph-based collaboration within %d years", d.windowYears)},
						StartDate:    nil, // Would need to query Neo4j for actual dates
						EndDate:      nil,
					})
				}
			}
		}
	}

	return details, nil
}

// CheckAuthorReviewerConflict checks if a specific author-reviewer pair has conflict
// This is a helper method that can be used when you have email addresses
func (d *RelationshipDetector) CheckAuthorReviewerConflict(
	ctx context.Context,
	authorEmail, reviewerEmail string,
) (bool, error) {
	yearThreshold := time.Now().Year() - d.windowYears

	return d.authorService.HasIndirectCollaboration(
		ctx,
		authorEmail,
		reviewerEmail,
		DefaultCOIPathThreshold,
		yearThreshold,
	)
}
