package assignment

import (
	"context"
	"fmt"

	"github.com/dcao/conferencespace/internal/assignment/coi"
	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
	"github.com/dcao/conferencespace/internal/assignment/matching"
	"github.com/dcao/conferencespace/internal/assignment/scoring"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/storage/assignment"
	"github.com/dcao/conferencespace/internal/storage/reviewer"
	"github.com/dcao/conferencespace/internal/storage/submission"
)

// Service orchestrates the automatic reviewer assignment process
type Service struct {
	coiService        *coi.Service
	scorer            scoring.SimilarityScorer
	matcher           matching.AssignmentMatcher
	reviewerStorage   reviewer.StorageInterface
	submissionStorage submission.StorageInterface
	assignmentStorage assignment.StorageInterface
}

// NewService creates a new assignment service with default Phase 1 (MVP) components
func NewService(
	reviewerStorage reviewer.StorageInterface,
	submissionStorage submission.StorageInterface,
	assignmentStorage assignment.StorageInterface,
) *Service {
	// Phase 1 MVP: Use composite COI detector with self-author and declared conflicts
	coiDetector := detectors.NewCompositeDetector(
		detectors.NewSelfAuthorDetector(),
		detectors.NewDeclaredConflictsDetector(),
	)
	coiService := coi.NewServiceWithDetector(coiDetector)

	return &Service{
		coiService:        coiService,
		scorer:            scoring.NewDomainJaccardScorer(),
		matcher:           matching.NewGreedyMatcher(),
		reviewerStorage:   reviewerStorage,
		submissionStorage: submissionStorage,
		assignmentStorage: assignmentStorage,
	}
}

// AutoAssignConfig contains configuration for auto-assignment
type AutoAssignConfig struct {
	MinReviewersPerPaper int
	MaxReviewersPerPaper int
	MaxPapersPerReviewer *int
	MinScoreThreshold    float64
	DryRun               bool
}

// AutoAssignResult contains the results of auto-assignment
type AutoAssignResult struct {
	TotalSubmissions int               `json:"total_submissions"`
	TotalReviewers   int               `json:"total_reviewers"`
	TotalAssignments int               `json:"total_assignments"`
	AverageScore     float64           `json:"average_score"`
	UnassignedPapers []int64           `json:"unassigned_papers"`
	ReviewerLoad     map[int64]int     `json:"reviewer_load"`
	Assignments      []*dto.Assignment `json:"assignments,omitempty"` // Only populated if DryRun=true
}

// AutoAssign performs automatic reviewer assignment
func (s *Service) AutoAssign(ctx context.Context, conferenceID int64, config AutoAssignConfig) (*AutoAssignResult, error) {
	// 1. Load accepted reviewers
	reviewers, _, err := s.reviewerStorage.List(ctx, conferenceID, &reviewer.ListParams{
		Status: "accepted",
		Limit:  1000, // Load all accepted reviewers
	})
	if err != nil {
		return nil, fmt.Errorf("failed to load reviewers: %w", err)
	}

	if len(reviewers) == 0 {
		return nil, fmt.Errorf("no accepted reviewers found")
	}

	// 2. Load submissions
	submissions, _, err := s.submissionStorage.List(ctx, &submission.QueryParams{
		ConferenceID: conferenceID,
		Limit:        1000, // Load all submissions
	})
	if err != nil {
		return nil, fmt.Errorf("failed to load submissions: %w", err)
	}

	if len(submissions) == 0 {
		return nil, fmt.Errorf("no submissions found")
	}

	// 3. Build COI map
	conflicts, err := s.coiService.BuildConflictMap(ctx, conferenceID, submissions, reviewers)
	if err != nil {
		return nil, fmt.Errorf("COI detection failed: %w", err)
	}

	// 4. Convert to scoring types and compute similarity matrix
	scoringSubmissions := make([]scoring.Submission, len(submissions))
	for i, sub := range submissions {
		domain := []string{}
		if sub.Information != nil {
			domain = sub.Information.Keywords
		}

		scoringSubmissions[i] = scoring.Submission{
			ID:       sub.ID,
			Title:    sub.Title,
			Abstract: sub.Abstract,
			Domain:   domain,
		}
	}

	scoringReviewers := make([]scoring.Reviewer, len(reviewers))
	for i, rev := range reviewers {
		scoringReviewers[i] = scoring.Reviewer{
			ID:     rev.ID,
			Domain: rev.Domain,
		}
	}

	scoreMatrix, err := s.scorer.ComputeMatrix(ctx, scoringSubmissions, scoringReviewers)
	if err != nil {
		return nil, fmt.Errorf("scoring failed: %w", err)
	}

	// 5. Run matching algorithm
	matchingSubmissions := make([]matching.Submission, len(submissions))
	for i, sub := range submissions {
		matchingSubmissions[i] = matching.Submission{ID: sub.ID}
	}

	matchingReviewers := make([]matching.Reviewer, len(reviewers))
	for i, rev := range reviewers {
		matchingReviewers[i] = matching.Reviewer{ID: rev.ID}
	}

	matchResult, err := s.matcher.Match(ctx, matching.MatchInput{
		Submissions: matchingSubmissions,
		Reviewers:   matchingReviewers,
		Scores:      scoreMatrix,
		Conflicts:   conflicts,
		Config: matching.MatchConfig{
			MinReviewersPerPaper: config.MinReviewersPerPaper,
			MaxReviewersPerPaper: config.MaxReviewersPerPaper,
			MaxPapersPerReviewer: config.MaxPapersPerReviewer,
			MinScoreThreshold:    config.MinScoreThreshold,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("matching failed: %w", err)
	}

	// 6. Convert to DTOs
	assignmentDTOs := make([]dto.Assignment, len(matchResult.Assignments))
	for i, assignment := range matchResult.Assignments {
		assignmentDTOs[i] = dto.Assignment{
			SubmissionID: assignment.SubmissionID,
			ReviewerID:   assignment.ReviewerID,
			Score:        assignment.Score,
			Status:       "pending",
		}
	}

	// 7. Save assignments if not dry run
	if !config.DryRun {
		_, err = s.assignmentStorage.BatchCreate(ctx, conferenceID, assignmentDTOs)
		if err != nil {
			return nil, fmt.Errorf("failed to save assignments: %w", err)
		}

		// 7.1. Bulk update submission status to "reviewing" for all assigned submissions
		assignedSubmissionIDs := make(map[int64]bool)
		for _, assignment := range matchResult.Assignments {
			assignedSubmissionIDs[assignment.SubmissionID] = true
		}

		// Convert map to slice for bulk update
		submissionIDsToUpdate := make([]int64, 0, len(assignedSubmissionIDs))
		for submissionID := range assignedSubmissionIDs {
			submissionIDsToUpdate = append(submissionIDsToUpdate, submissionID)
		}

		// Bulk update all assigned submissions' status to "reviewing" in a single query
		if len(submissionIDsToUpdate) > 0 {
			err = s.submissionStorage.BulkUpdateStatus(ctx, submissionIDsToUpdate, dto.StatusReviewing)
			if err != nil {
				// Log error but don't fail the whole operation
				// Assignment was successful, status update is secondary
				fmt.Printf("Warning: failed to bulk update submission status to reviewing: %v\n", err)
			}
		}
	}

	// 8. Build result
	result := &AutoAssignResult{
		TotalSubmissions: len(submissions),
		TotalReviewers:   len(reviewers),
		TotalAssignments: len(matchResult.Assignments),
		AverageScore:     matchResult.AverageScore,
		UnassignedPapers: matchResult.UnassignedPapers,
		ReviewerLoad:     matchResult.ReviewerLoadMap,
	}

	// Include assignments in response if dry run
	if config.DryRun {
		result.Assignments = make([]*dto.Assignment, len(assignmentDTOs))
		for i := range assignmentDTOs {
			result.Assignments[i] = &assignmentDTOs[i]
		}
	}

	return result, nil
}
