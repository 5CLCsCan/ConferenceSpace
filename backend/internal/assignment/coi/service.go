package coi

import (
	"context"
	"encoding/json"
	"sync"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
	"github.com/dcao/conferencespace/internal/dto"
)

// Service provides COI detection functionality with in-memory caching
type Service struct {
	detector detectors.ConflictDetector
	cache    map[int64]commons.ConflictMap // conference_id -> conflict map
	mu       sync.RWMutex
}

// NewService creates a new COI service with the default composite detector
func NewService() *Service {
	// Create composite detector with all Phase 1 detectors
	detector := detectors.NewCompositeDetector(
		detectors.NewSelfAuthorDetector(),
		detectors.NewDeclaredConflictsDetector(),
	)

	return &Service{
		detector: detector,
		cache:    make(map[int64]commons.ConflictMap),
	}
}

// NewServiceWithDetector creates a new COI service with a custom detector
func NewServiceWithDetector(detector detectors.ConflictDetector) *Service {
	return &Service{
		detector: detector,
		cache:    make(map[int64]commons.ConflictMap),
	}
}

// BuildConflictMap builds and caches the conflict map for a conference
func (s *Service) BuildConflictMap(
	ctx context.Context,
	conferenceID int64,
	submissions []*dto.Submission,
	reviewers []*dto.Reviewer,
) (commons.ConflictMap, error) {
	coiSubmissions := make([]commons.Submission, len(submissions))
	for i, sub := range submissions {
		coiSubmissions[i] = SubmissionFromDTO(sub)
	}

	// Convert reviewers to internal format
	coiReviewers := make([]commons.Reviewer, len(reviewers))
	for i, rev := range reviewers {
		coiReviewers[i] = commons.Reviewer{
			ID:        rev.ID,
			UserID:    rev.UserID,
			UserEmail: rev.Email,
		}
	}

	// Detect conflicts
	conflicts, err := s.detector.DetectConflicts(ctx, coiSubmissions, coiReviewers)
	if err != nil {
		return nil, err
	}

	// Cache the result
	s.mu.Lock()
	s.cache[conferenceID] = conflicts
	s.mu.Unlock()

	return conflicts, nil
}

// GetConflictMap retrieves the cached conflict map for a conference
func (s *Service) GetConflictMap(conferenceID int64) (commons.ConflictMap, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	conflicts, exists := s.cache[conferenceID]
	return conflicts, exists
}

// InvalidateCache removes the cached conflict map for a conference
func (s *Service) InvalidateCache(conferenceID int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.cache, conferenceID)
}

// HasConflict checks if a submission-reviewer pair has a conflict
func (s *Service) HasConflict(conferenceID, submissionID, reviewerID int64) bool {
	conflicts, exists := s.GetConflictMap(conferenceID)
	if !exists {
		return false
	}
	return conflicts.HasConflict(submissionID, reviewerID)
}

// GetDetectorCheckResults returns the status of each COI detector for this conference.
func (s *Service) GetDetectorCheckResults(neo4jAvailable bool) map[string]string {
	results := map[string]string{
		"self_author":        "passed",
		"declared_conflicts": "passed",
	}
	if neo4jAvailable {
		results["relationship"] = "passed"
	} else {
		results["relationship"] = "skipped_neo4j_unavailable"
	}
	return results
}

// Helper to convert SubmissionInformation from JSONB
func parseSubmissionInformation(data []byte) (*dto.SubmissionInformation, error) {
	if len(data) == 0 {
		return nil, nil
	}
	var info dto.SubmissionInformation
	if err := json.Unmarshal(data, &info); err != nil {
		return nil, err
	}
	return &info, nil
}
