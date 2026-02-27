package assignment

import (
	"context"
	"fmt"

	"github.com/dcao/conferencespace/internal/assignment/coi"
	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
	"github.com/dcao/conferencespace/internal/assignment/matching"
	"github.com/dcao/conferencespace/internal/assignment/scoring"
	"github.com/dcao/conferencespace/internal/clients"
	"github.com/dcao/conferencespace/internal/clients/neo4j"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/dcao/conferencespace/internal/storage"
	"github.com/dcao/conferencespace/internal/storage/assignment"
	"github.com/dcao/conferencespace/internal/storage/conference"
	"github.com/dcao/conferencespace/internal/storage/reviewer"
	"github.com/dcao/conferencespace/internal/storage/submission"
)

// Service orchestrates the automatic reviewer assignment process
type Service struct {
	coiService           *coi.Service
	scorer               scoring.SimilarityScorer
	matcher              matching.AssignmentMatcher
	reviewerStorage      reviewer.StorageInterface
	submissionStorage    submission.StorageInterface
	assignmentStorage    assignment.StorageInterface
	conferenceStorage    conference.StorageInterface
	neo4jClient          *neo4j.Client
	relationshipDetector *detectors.RelationshipDetector
}

// NewService creates a new assignment service with all COI detectors including graph-based
func NewService(
	store *storage.Storage,
	clientsLayer *clients.Clients,
) *Service {
	// Extract Neo4j client from clients if available
	var neo4jClient *neo4j.Client
	if clientsLayer != nil && clientsLayer.Neo4j != nil {
		neo4jClient = clientsLayer.Neo4j
	}

	// Create relationship detector with defaults (will be configured per conference)
	var relationshipDetector *detectors.RelationshipDetector
	var coiDetector detectors.ConflictDetector

	if neo4jClient != nil {
		// Create relationship detector with default window years
		// Path threshold is hardcoded to 3 hops
		relationshipDetector = detectors.NewRelationshipDetector(
			neo4jClient,
			detectors.DefaultCOIWindowYears,
		).(*detectors.RelationshipDetector)

		// Use composite detector with all detectors including graph-based
		coiDetector = detectors.NewCompositeDetector(
			detectors.NewSelfAuthorDetector(),
			detectors.NewDeclaredConflictsDetector(),
			relationshipDetector,
		)
	} else {
		// Fallback: Use basic detectors without graph-based COI
		coiDetector = detectors.NewCompositeDetector(
			detectors.NewSelfAuthorDetector(),
			detectors.NewDeclaredConflictsDetector(),
		)
	}

	coiService := coi.NewServiceWithDetector(coiDetector)

	return &Service{
		coiService:           coiService,
		scorer:               scoring.NewDomainJaccardScorer(),
		matcher:              matching.NewGreedyMatcher(),
		reviewerStorage:      store.Reviewer,
		submissionStorage:    store.Submission,
		assignmentStorage:    store.Assignment,
		conferenceStorage:    store.Conference,
		neo4jClient:          neo4jClient,
		relationshipDetector: relationshipDetector,
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
	// 0. Load conference and configure COI detector based on conference settings
	conf, err := s.conferenceStorage.GetByID(ctx, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("failed to load conference: %w", err)
	}

	// Configure relationship detector from conference settings
	if s.relationshipDetector != nil && conf.Configurations != nil {
		// Default value
		windowYears := detectors.DefaultCOIWindowYears

		// Override with conference setting if provided
		if conf.Configurations.COIWindowYears != nil {
			windowYears = *conf.Configurations.COIWindowYears
		}

		// Update detector with conference-specific window years
		// Path threshold is hardcoded to 3 hops (technical parameter)
		s.relationshipDetector.SetWindowYears(windowYears)
	}

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

	// 2.1. Filter submissions to only those without confirmed assignments
	var unassignedSubmissions []*dto.Submission
	for _, sub := range submissions {
		hasConfirmed, err := s.HasConfirmedAssignments(ctx, conferenceID, sub.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to check existing assignments for submission %d: %w", sub.ID, err)
		}
		if !hasConfirmed {
			unassignedSubmissions = append(unassignedSubmissions, sub)
		}
	}
	submissions = unassignedSubmissions

	if len(submissions) == 0 {
		return nil, fmt.Errorf("all submissions already have confirmed assignments")
	}

	// 2.2. Delete any existing suggestions for this conference before creating new ones
	err = s.assignmentStorage.DeleteSuggestionsByConference(ctx, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("failed to clear existing suggestions: %w", err)
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

	// 6. Convert to DTOs - use "suggested" status so chair can review before confirming
	assignmentDTOs := make([]dto.Assignment, len(matchResult.Assignments))
	for i, assignment := range matchResult.Assignments {
		assignmentDTOs[i] = dto.Assignment{
			SubmissionID: assignment.SubmissionID,
			ReviewerID:   assignment.ReviewerID,
			Score:        assignment.Score,
			Status:       model.AssignmentStatusSuggested,
		}
	}

	// 7. Save assignments as suggestions (always save, DryRun is deprecated)
	// The suggestions are saved with "suggested" status so the chair can review them
	// Status update to "reviewing" happens when chair confirms the suggestions
	_, err = s.assignmentStorage.BatchCreate(ctx, conferenceID, assignmentDTOs)
	if err != nil {
		return nil, fmt.Errorf("failed to save assignment suggestions: %w", err)
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

	// Always include assignments in response (needed for notifications when DryRun=false)
	result.Assignments = make([]*dto.Assignment, len(assignmentDTOs))
	for i := range assignmentDTOs {
		result.Assignments[i] = &assignmentDTOs[i]
	}

	return result, nil
}

// GetRelationshipDetector returns the relationship detector if available
// This is used by other services to check COI before inviting reviewers
func (s *Service) GetRelationshipDetector() *detectors.RelationshipDetector {
	return s.relationshipDetector
}

// HasConfirmedAssignments checks if a submission has any non-suggested assignments
func (s *Service) HasConfirmedAssignments(ctx context.Context, conferenceID int64, submissionID int64) (bool, error) {
	assignments, _, err := s.assignmentStorage.List(ctx, conferenceID, &assignment.ListParams{
		SubmissionID: submissionID,
	})
	if err != nil {
		return false, err
	}

	for _, a := range assignments {
		if a.Status != model.AssignmentStatusSuggested {
			return true, nil
		}
	}
	return false, nil
}

// GetCOIService returns the COI service for external COI checks
func (s *Service) GetCOIService() *coi.Service {
	return s.coiService
}
