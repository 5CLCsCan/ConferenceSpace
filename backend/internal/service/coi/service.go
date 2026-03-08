package coi

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	coiStorage "github.com/dcao/conferencespace/internal/storage/coi"
	reviewerStorage "github.com/dcao/conferencespace/internal/storage/reviewer"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
)

// AutoRefreshInterval is the duration after which COI data is considered stale
const AutoRefreshInterval = 5 * time.Minute

const dirtyScopeRefreshLimit = 200

// Service provides COI management functionality
type Service struct {
	detector          detectors.ConflictDetector
	coiStorage        coiStorage.StorageInterface
	submissionStorage submissionStorage.StorageInterface
	reviewerStorage   reviewerStorage.StorageInterface
	userStorage       userStorage.StorageInterface
}

// New creates a new COI service
func New(
	detector detectors.ConflictDetector,
	coiStor coiStorage.StorageInterface,
	submissionStor submissionStorage.StorageInterface,
	reviewerStor reviewerStorage.StorageInterface,
	userStor userStorage.StorageInterface,
) *Service {
	return &Service{
		detector:          detector,
		coiStorage:        coiStor,
		submissionStorage: submissionStor,
		reviewerStorage:   reviewerStor,
		userStorage:       userStor,
	}
}

// needsRefresh checks if a conference's COI data needs to be rebuilt
func (s *Service) needsRefresh(ctx context.Context, conferenceID int64) (bool, error) {
	lastTime, err := s.coiStorage.GetLastRebuildAt(ctx, conferenceID)
	if err != nil {
		return false, err
	}
	if lastTime == nil {
		return true, nil
	}
	return time.Since(*lastTime) > AutoRefreshInterval, nil
}

// markRefreshed updates the last rebuild time for a conference
func (s *Service) markRefreshed(ctx context.Context, conferenceID int64) error {
	return s.coiStorage.SetLastRebuildAt(ctx, conferenceID, time.Now())
}

// AutoRefreshIfNeeded checks if COI data is stale and triggers rebuild if needed
// Returns true if a refresh was triggered
func (s *Service) AutoRefreshIfNeeded(ctx context.Context, conferenceID int64) (bool, error) {
	processedDirtyScopes, err := s.RefreshDirtyScopes(ctx, conferenceID)
	if err != nil {
		return false, fmt.Errorf("failed to refresh dirty COI scopes: %w", err)
	}
	if processedDirtyScopes > 0 {
		return true, nil
	}

	needsRefresh, err := s.needsRefresh(ctx, conferenceID)
	if err != nil {
		return false, fmt.Errorf("failed to check COI refresh state: %w", err)
	}
	if !needsRefresh {
		return false, nil
	}

	// Rebuild COI relationships
	_, err = s.BuildAndStoreRelationships(ctx, conferenceID)
	if err != nil {
		return false, fmt.Errorf("auto-refresh failed: %w", err)
	}

	return true, nil
}

// MarkConferenceDirty marks an entire conference as needing COI recomputation.
func (s *Service) MarkConferenceDirty(ctx context.Context, conferenceID int64, reason string) error {
	return s.coiStorage.UpsertDirtyConference(ctx, conferenceID, reason)
}

// MarkSubmissionDirty marks a submission scope as needing COI recomputation.
func (s *Service) MarkSubmissionDirty(ctx context.Context, conferenceID, submissionID int64, reason string) error {
	return s.coiStorage.UpsertDirtySubmission(ctx, conferenceID, submissionID, reason)
}

// MarkReviewerDirty marks a reviewer scope as needing COI recomputation.
func (s *Service) MarkReviewerDirty(ctx context.Context, conferenceID, reviewerID int64, reason string) error {
	return s.coiStorage.UpsertDirtyReviewer(ctx, conferenceID, reviewerID, reason)
}

// RefreshDirtyScopes incrementally refreshes COI relationships for dirty submission/reviewer scopes.
func (s *Service) RefreshDirtyScopes(ctx context.Context, conferenceID int64) (int, error) {
	scopes, err := s.coiStorage.ListDirtyScopes(ctx, conferenceID, dirtyScopeRefreshLimit)
	if err != nil {
		return 0, fmt.Errorf("failed to list dirty scopes: %w", err)
	}
	if len(scopes) == 0 {
		return 0, nil
	}

	processed := 0
	for _, scope := range scopes {
		switch scope.ScopeType {
		case coiStorage.ScopeTypeConference:
			if _, err := s.BuildAndStoreRelationships(ctx, conferenceID); err != nil {
				return processed, fmt.Errorf("failed to refresh conference scope: %w", err)
			}
			if err := s.coiStorage.ClearDirtyScopes(ctx, conferenceID); err != nil {
				return processed, fmt.Errorf("failed to clear dirty scopes after conference rebuild: %w", err)
			}
			return len(scopes), nil
		case coiStorage.ScopeTypeSubmission:
			if scope.SubmissionID == nil {
				return processed, fmt.Errorf("dirty submission scope is missing submission_id")
			}
			if err := s.refreshSubmissionScope(ctx, conferenceID, *scope.SubmissionID); err != nil {
				return processed, fmt.Errorf("failed to refresh submission scope %d: %w", *scope.SubmissionID, err)
			}
		case coiStorage.ScopeTypeReviewer:
			if scope.ReviewerID == nil {
				return processed, fmt.Errorf("dirty reviewer scope is missing reviewer_id")
			}
			if err := s.refreshReviewerScope(ctx, conferenceID, *scope.ReviewerID); err != nil {
				return processed, fmt.Errorf("failed to refresh reviewer scope %d: %w", *scope.ReviewerID, err)
			}
		default:
			return processed, fmt.Errorf("unsupported dirty scope type: %s", scope.ScopeType)
		}

		if err := s.coiStorage.DeleteDirtyScope(ctx, conferenceID, scope.ScopeType, scope.ScopeKey); err != nil {
			return processed, fmt.Errorf("failed to clear dirty scope %s/%s: %w", scope.ScopeType, scope.ScopeKey, err)
		}
		processed++
	}

	if processed > 0 {
		if err := s.markRefreshed(ctx, conferenceID); err != nil {
			return processed, fmt.Errorf("failed to update refresh timestamp after dirty scope refresh: %w", err)
		}
	}

	return processed, nil
}

// BuildAndStoreRelationships detects and stores COI relationships for a conference
func (s *Service) BuildAndStoreRelationships(ctx context.Context, conferenceID int64) (int, error) {
	// Get all submissions for the conference
	submissions, _, err := s.submissionStorage.List(ctx, &submissionStorage.QueryParams{
		ConferenceID: conferenceID,
		Limit:        10000, // Get all submissions
	})
	if err != nil {
		return 0, fmt.Errorf("failed to fetch submissions: %w", err)
	}

	// Get all accepted reviewers for the conference
	reviewers, _, err := s.reviewerStorage.List(ctx, conferenceID, &reviewerStorage.ListParams{
		Status: "accepted",
		Limit:  10000, // Get all reviewers
	})
	if err != nil {
		return 0, fmt.Errorf("failed to fetch reviewers: %w", err)
	}

	detectorSubmissions := toDetectorSubmissions(submissions)
	detectorReviewers := toDetectorReviewers(reviewers)

	// Detect conflicts with details
	conflictDetails, err := s.detector.DetectConflictsWithDetails(
		ctx,
		detectorSubmissions,
		detectorReviewers,
	)
	if err != nil {
		return 0, fmt.Errorf("failed to detect conflicts: %w", err)
	}

	// Clear existing relationships for this conference
	if err := s.coiStorage.DeleteByConference(ctx, conferenceID); err != nil {
		return 0, fmt.Errorf("failed to clear existing relationships: %w", err)
	}

	relationships := toRelationships(conferenceID, s.detector.Name(), conflictDetails)

	// Store relationships in batch
	if err := s.coiStorage.BatchCreate(ctx, relationships); err != nil {
		return 0, fmt.Errorf("failed to store relationships: %w", err)
	}

	// Mark this conference as refreshed
	if err := s.markRefreshed(ctx, conferenceID); err != nil {
		return 0, fmt.Errorf("failed to persist refresh state: %w", err)
	}

	return len(relationships), nil
}

func toDetectorSubmissions(submissions []*dto.Submission) []commons.Submission {
	detectorSubmissions := make([]commons.Submission, len(submissions))
	for i, sub := range submissions {
		detectorSubmission := commons.Submission{
			ID:          sub.ID,
			AuthorEmail: sub.Author,
			CoAuthors:   []string{},
			Declared:    []commons.ConflictDeclaration{},
		}
		if sub.Information != nil {
			if sub.Information.CoAuthors != nil {
				detectorSubmission.CoAuthors = sub.Information.CoAuthors
			}
			if sub.Information.DeclaredConflicts != nil {
				for _, dc := range sub.Information.DeclaredConflicts {
					detectorSubmission.Declared = append(detectorSubmission.Declared, commons.ConflictDeclaration{
						Email:  dc.Email,
						Reason: dc.Reason,
					})
				}
			}
		}
		detectorSubmissions[i] = detectorSubmission
	}

	return detectorSubmissions
}

func toDetectorReviewers(reviewers []*dto.Reviewer) []commons.Reviewer {
	detectorReviewers := make([]commons.Reviewer, len(reviewers))
	for i, rev := range reviewers {
		detectorReviewers[i] = commons.Reviewer{
			ID:        rev.ID,
			UserID:    rev.UserID,
			UserEmail: rev.Email,
		}
	}

	return detectorReviewers
}

func toRelationships(conferenceID int64, detectorName string, conflictDetails []commons.ConflictDetail) []*model.COIRelationship {
	relationships := make([]*model.COIRelationship, 0, len(conflictDetails))
	for _, detail := range conflictDetails {
		evidenceJSON, err := json.Marshal(detail.Evidence)
		if err != nil {
			evidenceJSON = []byte("[]")
		}

		var submissionID *int64
		if detail.SubmissionID != 0 {
			submissionID = &detail.SubmissionID
		}

		relationships = append(relationships, &model.COIRelationship{
			ConferenceID:     conferenceID,
			ReviewerID:       detail.ReviewerID,
			AuthorEmail:      detail.AuthorEmail,
			SubmissionID:     submissionID,
			RelationshipType: detail.Type,
			Severity:         detail.Severity,
			Description:      buildRelationshipDescription(detail),
			Evidence:         evidenceJSON,
			StartDate:        detail.StartDate,
			EndDate:          detail.EndDate,
			DetectedBy:       detectorName,
		})
	}

	return relationships
}

func (s *Service) refreshSubmissionScope(ctx context.Context, conferenceID, submissionID int64) error {
	if err := s.coiStorage.DeleteByConferenceAndSubmission(ctx, conferenceID, submissionID); err != nil {
		return err
	}

	submission, err := s.submissionStorage.GetByID(ctx, submissionID)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			return nil
		}
		return fmt.Errorf("failed to fetch submission %d: %w", submissionID, err)
	}
	if submission.ConferenceID != conferenceID {
		return nil
	}

	reviewers, _, err := s.reviewerStorage.List(ctx, conferenceID, &reviewerStorage.ListParams{
		Status: model.ReviewerStatusAccepted,
		Limit:  10000,
	})
	if err != nil {
		return fmt.Errorf("failed to fetch accepted reviewers: %w", err)
	}
	if len(reviewers) == 0 {
		return nil
	}

	conflictDetails, err := s.detector.DetectConflictsWithDetails(
		ctx,
		toDetectorSubmissions([]*dto.Submission{submission}),
		toDetectorReviewers(reviewers),
	)
	if err != nil {
		return fmt.Errorf("failed to detect conflicts for submission scope: %w", err)
	}

	relationships := toRelationships(conferenceID, s.detector.Name(), conflictDetails)
	if len(relationships) == 0 {
		return nil
	}

	if err := s.coiStorage.BatchCreate(ctx, relationships); err != nil {
		return fmt.Errorf("failed to store submission-scope relationships: %w", err)
	}

	return nil
}

func (s *Service) refreshReviewerScope(ctx context.Context, conferenceID, reviewerID int64) error {
	if err := s.coiStorage.DeleteByConferenceAndReviewer(ctx, conferenceID, reviewerID); err != nil {
		return err
	}

	reviewer, err := s.reviewerStorage.GetByID(ctx, reviewerID)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			return nil
		}
		return fmt.Errorf("failed to fetch reviewer %d: %w", reviewerID, err)
	}
	if reviewer.ConferenceID != conferenceID {
		return nil
	}
	if reviewer.Status != model.ReviewerStatusAccepted {
		return nil
	}

	submissions, _, err := s.submissionStorage.List(ctx, &submissionStorage.QueryParams{
		ConferenceID: conferenceID,
		Limit:        10000,
	})
	if err != nil {
		return fmt.Errorf("failed to fetch submissions: %w", err)
	}
	if len(submissions) == 0 {
		return nil
	}

	conflictDetails, err := s.detector.DetectConflictsWithDetails(
		ctx,
		toDetectorSubmissions(submissions),
		toDetectorReviewers([]*dto.Reviewer{reviewer}),
	)
	if err != nil {
		return fmt.Errorf("failed to detect conflicts for reviewer scope: %w", err)
	}

	relationships := toRelationships(conferenceID, s.detector.Name(), conflictDetails)
	if len(relationships) == 0 {
		return nil
	}

	if err := s.coiStorage.BatchCreate(ctx, relationships); err != nil {
		return fmt.Errorf("failed to store reviewer-scope relationships: %w", err)
	}

	return nil
}

// GetDashboardStats retrieves dashboard statistics
func (s *Service) GetDashboardStats(ctx context.Context, conferenceID int64) (*dto.COIDashboardStats, error) {
	return s.coiStorage.GetDashboardStats(ctx, conferenceID)
}

// GetAllRelationships retrieves paginated and filtered COI relationships with enriched data
func (s *Service) GetAllRelationships(ctx context.Context, req *dto.COIRelationshipListRequest) (*dto.COIRelationshipListResponse, error) {
	// Calculate offset from page number
	limit := req.Limit
	if limit <= 0 {
		limit = 100
	}
	page := req.Page
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	// Query storage
	filters := &coiStorage.QueryFilters{
		Severity:         req.Severity,
		RelationshipType: req.RelationshipType,
		Search:           req.Search,
		Limit:            limit,
		Offset:           offset,
	}

	relationships, total, err := s.coiStorage.GetByConference(ctx, req.ConferenceID, filters)
	if err != nil {
		return nil, fmt.Errorf("failed to query relationships: %w", err)
	}

	// Enrich with reviewer and author details
	enrichedRels := make([]*dto.COIRelationship, 0, len(relationships))
	reviewerCache := make(map[int64]string)
	reviewerEmailCache := make(map[int64]string)
	authorCache := make(map[string]*dto.UserResponse)
	for _, rel := range relationships {
		enriched := rel.ToDTO()

		// Get reviewer details
		if cachedName, ok := reviewerCache[rel.ReviewerID]; ok {
			enriched.ReviewerName = cachedName
			enriched.ReviewerEmail = reviewerEmailCache[rel.ReviewerID]
		} else {
			reviewer, err := s.reviewerStorage.GetByID(ctx, rel.ReviewerID)
			if err == nil && reviewer != nil {
				enriched.ReviewerEmail = reviewer.Email

				// Get reviewer's user details for name
				if reviewer.UserID > 0 {
					reviewerUser, err := s.userStorage.GetByID(ctx, reviewer.UserID)
					if err == nil && reviewerUser != nil {
						enriched.ReviewerName = reviewerUser.FirstName + " " + reviewerUser.LastName
					}
				}
				reviewerCache[rel.ReviewerID] = enriched.ReviewerName
				reviewerEmailCache[rel.ReviewerID] = enriched.ReviewerEmail
			}
		}

		// Get author details
		author, found := authorCache[rel.AuthorEmail]
		if !found {
			var err error
			author, err = s.userStorage.GetByEmail(ctx, rel.AuthorEmail)
			if err == nil && author != nil {
				authorCache[rel.AuthorEmail] = author
			}
		}
		if author != nil {
			enriched.AuthorName = author.FirstName + " " + author.LastName
			if len(author.Domain) > 0 {
				// Use domain as affiliation for now
				enriched.AuthorAffiliation = author.Domain[0]
			}
		}

		// Parse evidence from JSON (ignore errors - evidence is optional)
		_ = enriched.UnmarshalEvidence()
		enrichedRels = append(enrichedRels, enriched)
	}

	return &dto.COIRelationshipListResponse{
		Relationships: enrichedRels,
		Total:         total,
		Page:          page,
		Limit:         limit,
	}, nil
}

func buildRelationshipDescription(detail commons.ConflictDetail) string {
	base := detail.Description
	if base == "" {
		base = fmt.Sprintf("Conflict detected between reviewer %d and author %s", detail.ReviewerID, detail.AuthorEmail)
	}

	if len(detail.Evidence) == 0 {
		return base
	}

	return fmt.Sprintf("%s. Evidence: %s", base, detail.Evidence[0])
}

// CheckReviewerAuthorCOI performs detailed COI check for a reviewer-author pair
func (s *Service) CheckReviewerAuthorCOI(ctx context.Context, conferenceID int64, reviewerID int64, authorEmail string) (*dto.COIReport, error) {
	// Get relationships
	relationships, err := s.coiStorage.GetByReviewerAndAuthor(ctx, conferenceID, reviewerID, authorEmail)
	if err != nil {
		return nil, fmt.Errorf("failed to query relationships: %w", err)
	}

	// Get reviewer details
	reviewer, err := s.reviewerStorage.GetByID(ctx, reviewerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get reviewer: %w", err)
	}

	// Get reviewer's user details for name
	var reviewerName string
	if reviewer.UserID > 0 {
		reviewerUser, err := s.userStorage.GetByID(ctx, reviewer.UserID)
		if err == nil && reviewerUser != nil {
			reviewerName = reviewerUser.FirstName + " " + reviewerUser.LastName
		}
	}

	// Get author details
	author, err := s.userStorage.GetByEmail(ctx, authorEmail)
	if err != nil {
		return nil, fmt.Errorf("failed to get author: %w", err)
	}

	authorName := author.FirstName + " " + author.LastName

	// Convert to DTOs
	relDTOs := make([]*dto.COIRelationship, 0, len(relationships))
	for _, rel := range relationships {
		relDTO := rel.ToDTO()
		relDTO.UnmarshalEvidence()
		relDTOs = append(relDTOs, relDTO)
	}

	// Calculate overall severity (highest of all relationships)
	severity := "none"
	if len(relationships) > 0 {
		for _, rel := range relationships {
			if rel.Severity == "high" {
				severity = "high"
				break
			} else if rel.Severity == "medium" && severity != "high" {
				severity = "medium"
			} else if rel.Severity == "low" && severity == "none" {
				severity = "low"
			}
		}
	}

	// Generate summary
	summary := ""
	if len(relationships) == 0 {
		summary = fmt.Sprintf("No conflicts of interest found between %s and %s",
			reviewerName, authorName)
	} else {
		summary = fmt.Sprintf("Found %d relationship(s) between %s and %s",
			len(relationships), reviewerName, authorName)
	}

	// Determine recommendation
	recommendation := "assign"
	switch severity {
	case "high":
		recommendation = "avoid"
	case "medium":
		recommendation = "review"
	case "low":
		recommendation = "assign"
	}

	affiliation := ""
	if len(author.Domain) > 0 {
		affiliation = author.Domain[0]
	}

	return &dto.COIReport{
		ReviewerID:          reviewerID,
		ReviewerName:        reviewerName,
		ReviewerEmail:       reviewer.Email,
		ReviewerAffiliation: "", // Not stored in reviewer model
		AuthorEmail:         authorEmail,
		AuthorName:          authorName,
		AuthorAffiliation:   affiliation,
		COIType:             "author",
		Severity:            severity,
		Relationships:       relDTOs,
		Summary:             summary,
		Recommendation:      recommendation,
	}, nil
}

// GetPaperCOISummaries retrieves COI summaries grouped by paper
func (s *Service) GetPaperCOISummaries(ctx context.Context, req *dto.PaperCOIListRequest) (*dto.PaperCOIListResponse, error) {
	// Calculate offset from page number
	limit := req.Limit
	if limit <= 0 {
		limit = 10
	}
	page := req.Page
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	// Query storage
	filters := &coiStorage.PaperQueryFilters{
		Severity: req.Severity,
		Search:   req.Search,
		Limit:    limit,
		Offset:   offset,
	}

	summaryData, total, err := s.coiStorage.GetPaperSummaries(ctx, req.ConferenceID, filters)
	if err != nil {
		return nil, fmt.Errorf("failed to query paper summaries: %w", err)
	}

	// Convert to DTOs and enrich
	papers := make([]*dto.PaperCOISummary, 0, len(summaryData))
	for _, data := range summaryData {
		// Get submission details
		submission, err := s.submissionStorage.GetByID(ctx, data.SubmissionID)
		if err != nil {
			continue
		}

		// Build author info
		authors := []*dto.AuthorInfo{{
			Email: submission.Author,
			Name:  submission.Author,
		}}

		// Get conflicted reviewers for this paper
		conflictedReviewers := []*dto.ConflictedReviewerInfo{}

		// Query all COI relationships for this submission
		relationships, err := s.coiStorage.GetBySubmission(ctx, req.ConferenceID, data.SubmissionID)
		if err == nil && len(relationships) > 0 {
			// Group by reviewer and aggregate
			reviewerMap := make(map[int64]*dto.ConflictedReviewerInfo)

			for _, rel := range relationships {
				if existing, ok := reviewerMap[rel.ReviewerID]; ok {
					// Add to existing reviewer's reasons
					existing.Reasons = append(existing.Reasons, rel.Description)
					// Update severity if higher
					if rel.Severity == "high" {
						existing.Severity = "high"
					} else if rel.Severity == "medium" && existing.Severity != "high" {
						existing.Severity = "medium"
					}
				} else {
					// Get reviewer details
					reviewer, err := s.reviewerStorage.GetByID(ctx, rel.ReviewerID)
					if err != nil {
						continue
					}

					reviewerName := ""
					if reviewer.UserID > 0 {
						reviewerUser, err := s.userStorage.GetByID(ctx, reviewer.UserID)
						if err == nil && reviewerUser != nil {
							reviewerName = reviewerUser.FirstName + " " + reviewerUser.LastName
						}
					}

					reviewerMap[rel.ReviewerID] = &dto.ConflictedReviewerInfo{
						ReviewerID:    rel.ReviewerID,
						ReviewerName:  reviewerName,
						ReviewerEmail: reviewer.Email,
						Severity:      rel.Severity,
						Reasons:       []string{rel.Description},
					}
				}
			}

			// Convert map to slice
			for _, info := range reviewerMap {
				conflictedReviewers = append(conflictedReviewers, info)
			}
		}

		papers = append(papers, &dto.PaperCOISummary{
			PaperID:             fmt.Sprintf("%d", data.SubmissionID),
			PaperTitle:          data.PaperTitle,
			Authors:             authors,
			TotalConflicts:      data.HighSeverityCount + data.MediumSeverityCount + data.LowSeverityCount,
			HighSeverityCount:   data.HighSeverityCount,
			MediumSeverityCount: data.MediumSeverityCount,
			LowSeverityCount:    data.LowSeverityCount,
			ConflictedReviewers: conflictedReviewers,
		})
	}

	return &dto.PaperCOIListResponse{
		Papers: papers,
		Total:  total,
		Page:   page,
		Limit:  limit,
	}, nil
}

// InvalidateCache clears COI relationships for a conference (for re-detection)
func (s *Service) InvalidateCache(ctx context.Context, conferenceID int64) error {
	return s.coiStorage.DeleteByConference(ctx, conferenceID)
}
