package detectors

import (
	"context"
	"fmt"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
)

// CompositeDetector combines multiple COI detectors
type CompositeDetector struct {
	detectors []ConflictDetector
}

// NewCompositeDetector creates a new composite detector
func NewCompositeDetector(detectors ...ConflictDetector) ConflictDetector {
	return &CompositeDetector{detectors: detectors}
}

// Name returns the detector's identifier
func (d *CompositeDetector) Name() string {
	return "composite"
}

// DetectConflicts runs all detectors and merges their results
func (d *CompositeDetector) DetectConflicts(
	ctx context.Context,
	submissions []commons.Submission,
	reviewers []commons.Reviewer,
) (commons.ConflictMap, error) {
	// Initialize merged conflicts map
	merged := make(commons.ConflictMap)

	// Run each detector and merge results
	for _, detector := range d.detectors {
		conflicts, err := detector.DetectConflicts(ctx, submissions, reviewers)
		if err != nil {
			return nil, fmt.Errorf("%s detector failed: %w", detector.Name(), err)
		}

		// Merge conflicts (union of all conflicts)
		merged.Merge(conflicts)
	}

	return merged, nil
}

// DetectConflictsWithDetails runs all detectors and aggregates their detailed results
func (d *CompositeDetector) DetectConflictsWithDetails(
	ctx context.Context,
	submissions []commons.Submission,
	reviewers []commons.Reviewer,
) ([]commons.ConflictDetail, error) {
	var allDetails []commons.ConflictDetail

	// Run each detector and collect all details
	for _, detector := range d.detectors {
		details, err := detector.DetectConflictsWithDetails(ctx, submissions, reviewers)
		if err != nil {
			return nil, fmt.Errorf("%s detector failed: %w", detector.Name(), err)
		}

		allDetails = append(allDetails, details...)
	}

	return allDetails, nil
}

// HasConflict checks if any detector reports a conflict
func (d *CompositeDetector) HasConflict(ctx context.Context, submissionID, reviewerID int64) (bool, error) {
	for _, detector := range d.detectors {
		hasConflict, err := detector.HasConflict(ctx, submissionID, reviewerID)
		if err != nil {
			return false, fmt.Errorf("%s detector failed: %w", detector.Name(), err)
		}
		if hasConflict {
			return true, nil
		}
	}
	return false, nil
}
