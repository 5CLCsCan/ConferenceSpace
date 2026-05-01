package assignment

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/dcao/conferencespace/internal/assignment"
	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	coiService "github.com/dcao/conferencespace/internal/service/coi"
	notificationService "github.com/dcao/conferencespace/internal/service/notification"
	"github.com/dcao/conferencespace/internal/storage"
	assignmentStorage "github.com/dcao/conferencespace/internal/storage/assignment"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
	fileStorage "github.com/dcao/conferencespace/internal/storage/file"
	reviewerStorage "github.com/dcao/conferencespace/internal/storage/reviewer"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

// Controller handles assignment-related HTTP requests
type Controller struct {
	assignmentService   *assignment.Service
	assignmentStorage   assignmentStorage.StorageInterface
	reviewerStorage     reviewerStorage.StorageInterface
	submissionStorage   submissionStorage.StorageInterface
	fileStorage         fileStorage.StorageInterface
	conferenceStorage   conferenceStorage.StorageInterface
	notificationService *notificationService.Service
	coiService          *coiService.Service
	roleStorage         conferenceuserrole.StorageInterface
	workflowClient      reviewerWorkflowClient
}

type reviewerWorkflowClient interface {
	LookupReviewerBriefing(
		ctx context.Context,
		token string,
		requestPayload *aiServiceClient.ReviewerBriefingResolveRequest,
	) (*aiServiceClient.ReviewerBriefingResolveResponse, error)
	GenerateReviewerBriefing(
		ctx context.Context,
		token string,
		requestPayload *aiServiceClient.ReviewerBriefingResolveRequest,
		filename string,
		fileContent []byte,
	) (*aiServiceClient.ReviewerBriefingResolveResponse, error)
	ResolveReviewQualityAudit(
		ctx context.Context,
		token string,
		requestPayload *aiServiceClient.ReviewQualityAuditResolveRequest,
	) (*aiServiceClient.ReviewQualityAuditResolveResponse, error)
	LookupPaperAnnotation(
		ctx context.Context,
		token string,
		requestPayload *aiServiceClient.PaperAnnotationResolveRequest,
	) (*aiServiceClient.PaperAnnotationResolveResponse, error)
	GeneratePaperAnnotation(
		ctx context.Context,
		token string,
		requestPayload *aiServiceClient.PaperAnnotationResolveRequest,
		filename string,
		fileContent []byte,
	) (*aiServiceClient.PaperAnnotationResolveResponse, error)
}

// New creates a new assignment controller
func New(store *storage.Storage, fileStore fileStorage.StorageInterface, workflowClient reviewerWorkflowClient, assignmentService *assignment.Service, coiSvc *coiService.Service) *Controller {
	return &Controller{
		assignmentService: assignmentService,
		assignmentStorage: store.Assignment,
		reviewerStorage:   store.Reviewer,
		submissionStorage: store.Submission,
		fileStorage:       fileStore,
		conferenceStorage: store.Conference,
		coiService:        coiSvc,
		roleStorage:       store.ConferenceUserRole,
		workflowClient:    workflowClient,
	}
}

// NewWithNotifications creates a new assignment controller with notification support
func NewWithNotifications(store *storage.Storage, fileStore fileStorage.StorageInterface, workflowClient reviewerWorkflowClient, assignmentService *assignment.Service, notifSvc *notificationService.Service, coiSvc *coiService.Service) *Controller {
	return &Controller{
		assignmentService:   assignmentService,
		assignmentStorage:   store.Assignment,
		reviewerStorage:     store.Reviewer,
		submissionStorage:   store.Submission,
		fileStorage:         fileStore,
		conferenceStorage:   store.Conference,
		notificationService: notifSvc,
		coiService:          coiSvc,
		roleStorage:         store.ConferenceUserRole,
		workflowClient:      workflowClient,
	}
}

// AutoAssign triggers automatic reviewer assignment
// @Summary Auto-assign reviewers to submissions
// @Description Automatically assigns accepted reviewers to submissions based on similarity scoring and COI detection
// @Tags assignments
// @Accept json
// @Produce json
// @Param conference_id path int true "Conference ID"
// @Param request body dto.AutoAssignRequest true "Auto-assignment configuration"
// @Success 200 {object} dto.AutoAssignResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/conferences/{conference_id}/submissions/auto-assign [post]
func (c *Controller) AutoAssign(ginCtx *gin.Context, req *dto.AutoAssignRequest) (*dto.AutoAssignResponse, error) {
	ctx := ginCtx.Request.Context()

	// Get conference ID from path
	conferenceIDStr := ginCtx.Param("conference_id")
	conferenceID, err := strconv.ParseInt(conferenceIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid conference_id")
	}

	// RBAC: only chair or co-chair can trigger auto-assign
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}
	if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, conferenceID, userEmail) {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only chair can trigger auto-assign")
	}

	// Validate
	if req.MaxReviewersPerPaper < req.MinReviewersPerPaper {
		return nil, fmt.Errorf("max_reviewers_per_paper must be >= min_reviewers_per_paper")
	}

	// Execute auto-assignment
	result, err := c.assignmentService.AutoAssign(ctx, conferenceID, assignment.AutoAssignConfig{
		MinReviewersPerPaper: req.MinReviewersPerPaper,
		MaxReviewersPerPaper: req.MaxReviewersPerPaper,
		MaxPapersPerReviewer: req.MaxPapersPerReviewer,
		MinScoreThreshold:    req.MinScoreThreshold,
		DryRun:               req.DryRun,
	})
	if err != nil {
		return nil, err
	}

	// Store COI relationships in database
	// This enables the COI dashboard without manually calling rebuild
	if c.coiService != nil {
		go func() {
			bgCtx := context.Background()
			count, err := c.coiService.BuildAndStoreRelationships(bgCtx, conferenceID)
			if err != nil {
				fmt.Printf("Warning: Failed to store COI relationships: %v\n", err)
			} else {
				fmt.Printf("Stored %d COI relationships for conference %d\n", count, conferenceID)
			}
		}()
	}

	// NOTE: Notifications are NOT sent here anymore.
	// Assignments are now created as "suggested" status.
	// Notifications are sent when the chair confirms the suggestions via ConfirmSuggestions endpoint.

	// Convert to DTO response
	return &dto.AutoAssignResponse{
		TotalSubmissions: result.TotalSubmissions,
		TotalReviewers:   result.TotalReviewers,
		TotalAssignments: result.TotalAssignments,
		AverageScore:     result.AverageScore,
		UnassignedPapers: result.UnassignedPapers,
		ReviewerLoad:     result.ReviewerLoad,
		Assignments:      result.Assignments,
	}, nil
}

// SaveReview godoc
// @Summary      Save or submit a review
// @Description  Save a draft or submit a final review for an assigned paper. Only the assigned reviewer can save/update their review.
// @Tags         assignments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        assignment_id path int true "Assignment ID"
// @Param        request body dto.ReviewSaveRequest true "Review data"
// @Success      200 {object} dto.Assignment
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/assignments/{assignment_id}/review [put]
func (c *Controller) SaveReview(ginCtx *gin.Context, req *dto.ReviewSaveRequest) (*dto.Assignment, error) {
	ctx := ginCtx.Request.Context()
	if err := assignReviewPathScope(ginCtx, &req.AssignmentID, &req.ConferenceID); err != nil {
		return nil, err
	}

	assignment, _, userID, userEmail, _, err := c.loadOwnedReviewScope(ginCtx, req.AssignmentID, req.ConferenceID)
	if err != nil {
		return nil, err
	}
	reviewer, err := c.reviewerStorage.GetByID(ctx, assignment.ReviewerID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to get reviewer info")
	}

	// Block access if assignment is pending (must accept invitation first)
	if assignment.Status == model.AssignmentStatusPending {
		return nil, handler.NewDetailedErrorResponse(
			http.StatusForbidden,
			"you must accept the invitation before accessing the review",
			map[string]interface{}{
				"redirect": fmt.Sprintf("/role/reviewer/invitations/%d", req.AssignmentID),
			},
		)
	}

	// Block access if assignment was declined
	if assignment.Status == model.AssignmentStatusDeclined {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "this assignment was declined")
	}

	// Check if review is already submitted (cannot edit submitted reviews)
	if assignment.ReviewStatus != nil && *assignment.ReviewStatus == model.ReviewStatusSubmitted {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "cannot edit a submitted review")
	}

	// Validation for submitted reviews
	if req.Status == model.ReviewStatusSubmitted {
		if err := validateSubmittedReviewRequest(req); err != nil {
			return nil, err
		}

		auditResponse, _, _, _, auditFailed, auditFailureMessage, err := c.executeReviewAudit(
			ginCtx,
			req.AssignmentID,
			req.ConferenceID,
			dto.ReviewAuditModeSubmitEnforcement,
			req.ReviewData,
			req.ReviewScore,
		)
		if err != nil {
			return nil, err
		}
		if auditFailed {
			if !req.AuditFailureOverrideConfirmed {
				return nil, handler.NewDetailedErrorResponse(
					http.StatusConflict,
					"review audit could not be completed",
					map[string]interface{}{
						"code":             "review_audit_failed",
						"override_allowed": true,
						"message":          auditFailureMessage,
					},
				)
			}
			_ = c.assignmentStorage.AppendReviewAuditEvent(ctx, &dto.ReviewAuditEvent{
				AssignmentID: assignment.ID,
				ConferenceID: assignment.ConferenceID,
				ActorID:      userID,
				ActorEmail:   userEmail,
				EventType:    reviewAuditEventSubmitOverrideAfterAuditFailed,
				Payload: map[string]interface{}{
					"reason": auditFailureMessage,
				},
			})
		}
		if !auditFailed && auditResponse != nil && auditResponse.Status == "block" {
			return nil, handler.NewDetailedErrorResponse(
				http.StatusConflict,
				"review audit found blocking issues",
				map[string]interface{}{
					"code":  "review_audit_blocked",
					"audit": auditResponse,
				},
			)
		}
	}

	// Save review
	updatedAssignment, err := c.assignmentStorage.SaveReview(ctx, req.AssignmentID, req.ReviewScore, req.ReviewData, req.Status)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, fmt.Sprintf("failed to save review: %v", err))
	}

	// Send notification to chair when review is submitted
	if c.notificationService != nil && req.Status == model.ReviewStatusSubmitted {
		// Capture values for goroutine (use background context since request context will be cancelled)
		subID := assignment.SubmissionID
		confID := assignment.ConferenceID
		revEmail := reviewer.Email
		subStorage := c.submissionStorage
		confStorage := c.conferenceStorage
		notifSvc := c.notificationService
		go func() {
			bgCtx := context.Background()
			// Get submission
			submission, err := subStorage.GetByID(bgCtx, subID)
			if err != nil {
				fmt.Printf("Warning: Failed to get submission for notification: %v\n", err)
				return
			}

			// Get conference to find chair
			conference, err := confStorage.GetByID(bgCtx, confID)
			if err != nil {
				fmt.Printf("Warning: Failed to get conference for notification: %v\n", err)
				return
			}

			// Notify chair
			if conference.Chair != "" {
				// Use email as reviewer name since Reviewer DTO doesn't have name fields
				reviewerName := revEmail
				err = notifSvc.NotifyReviewSubmitted(
					bgCtx,
					conference.Chair,
					reviewerName,
					submission.Title,
					confID,
					subID,
				)
				if err != nil {
					fmt.Printf("Warning: Failed to notify chair about review submission: %v\n", err)
				}
			}
		}()
	}

	return updatedAssignment, nil
}

func validateSubmittedReviewRequest(req *dto.ReviewSaveRequest) error {
	if req.ReviewScore == nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "review_score is required for submitted reviews")
	}
	if req.ReviewData == nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "review_data is required for submitted reviews")
	}
	if *req.ReviewScore < 0.0 || *req.ReviewScore > 10.0 {
		return handler.NewErrorResponse(http.StatusBadRequest, "review_score must be between 0.00 and 10.00")
	}
	if strings.TrimSpace(req.ReviewData.Feedback.Summary) == "" {
		return handler.NewErrorResponse(http.StatusBadRequest, "feedback summary is required for submitted reviews")
	}
	if strings.TrimSpace(req.ReviewData.Feedback.Strengths) == "" {
		return handler.NewErrorResponse(http.StatusBadRequest, "feedback strengths is required for submitted reviews")
	}
	if strings.TrimSpace(req.ReviewData.Feedback.Weaknesses) == "" {
		return handler.NewErrorResponse(http.StatusBadRequest, "feedback weaknesses is required for submitted reviews")
	}
	return nil
}

// GetReview godoc
// @Summary      Get a review
// @Description  Retrieve a review for an assigned paper. Only the assigned reviewer can view their review.
// @Tags         assignments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        assignment_id path int true "Assignment ID"
// @Success      200 {object} dto.Assignment
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/assignments/{assignment_id}/review [get]
func (c *Controller) GetReview(ginCtx *gin.Context, req *dto.ReviewGetRequest) (*dto.Assignment, error) {
	ctx := ginCtx.Request.Context()

	// CRITICAL: Extract authenticated user email
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	// CRITICAL: Fetch assignment and verify reviewer ownership
	assignment, err := c.assignmentStorage.GetReview(ctx, req.AssignmentID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "assignment not found")
	}

	// Get reviewer details to check email
	reviewer, err := c.reviewerStorage.GetByID(ctx, assignment.ReviewerID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to get reviewer info")
	}

	// CRITICAL: Verify user is the assigned reviewer
	if reviewer.Email != userEmail {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "you are not authorized to view this review")
	}

	// Block access if assignment is pending (must accept invitation first)
	if assignment.Status == model.AssignmentStatusPending {
		return nil, handler.NewDetailedErrorResponse(
			http.StatusForbidden,
			"you must accept the invitation before accessing the review",
			map[string]interface{}{
				"redirect": fmt.Sprintf("/role/reviewer/invitations/%d", req.AssignmentID),
			},
		)
	}

	// Block access if assignment was declined
	if assignment.Status == model.AssignmentStatusDeclined {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "this assignment was declined")
	}

	return assignment, nil
}

// ListReviews godoc
// @Summary      List all reviews for a submission
// @Description  Retrieve all submitted reviews for a specific submission. Only conference chair can access.
// @Tags         assignments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission_id path int true "Submission ID"
// @Param        limit query int false "Limit" default(10)
// @Param        offset query int false "Offset" default(0)
// @Success      200 {object} dto.ReviewListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /v1/conferences/{conference_id}/submissions/{id}/reviews [get]
func (c *Controller) ListReviews(ginCtx *gin.Context, req *dto.ReviewListRequest) (*dto.ReviewListResponse, error) {
	ctx := ginCtx.Request.Context()

	// Set defaults
	if req.Limit == 0 {
		req.Limit = 10
	}
	if req.Offset < 0 {
		req.Offset = 0
	}

	// Use :submission_id from path as submission ID
	submissionIDStr := ginCtx.Param("submission_id")
	submissionID, err := strconv.ParseInt(submissionIDStr, 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid submission id")
	}

	reviews, total, err := c.assignmentStorage.GetReviewsBySubmission(ctx, submissionID, req.Limit, req.Offset)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, fmt.Sprintf("failed to list reviews: %v", err))
	}

	return &dto.ReviewListResponse{
		Reviews: reviews,
		Total:   total,
		Limit:   req.Limit,
		Offset:  req.Offset,
	}, nil
}

// GetReviewAnalytics godoc
// @Summary      Get review analytics for a submission
// @Description  Retrieve aggregated analytics for all reviews of a submission. Only conference chair can access.
// @Tags         assignments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission_id path int true "Submission ID"
// @Success      200 {object} dto.ReviewAnalyticsResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /v1/conferences/{conference_id}/submissions/{id}/reviews/analytics [get]
func (c *Controller) GetReviewAnalytics(ginCtx *gin.Context) (*dto.ReviewAnalyticsResponse, error) {
	ctx := ginCtx.Request.Context()

	// Get submission ID from path
	submissionIDStr := ginCtx.Param("submission_id")
	submissionID, err := strconv.ParseInt(submissionIDStr, 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid submission id")
	}

	// Get analytics
	analytics, err := c.assignmentStorage.GetReviewAnalytics(ctx, submissionID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, fmt.Sprintf("failed to get analytics: %v", err))
	}

	return analytics, nil
}

// ================== Suggestion Endpoints ==================

// GetSuggestions retrieves all suggested assignments for a conference
// @Summary Get assignment suggestions
// @Description Get all suggested reviewer assignments for a conference, grouped by paper
// @Tags assignments
// @Accept json
// @Produce json
// @Param conference_id path int true "Conference ID"
// @Success 200 {object} dto.SuggestionsListResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/conferences/{conference_id}/assignments/suggestions [get]
func (c *Controller) GetSuggestions(ginCtx *gin.Context) (*dto.SuggestionsListResponse, error) {
	ctx := ginCtx.Request.Context()

	conferenceIDStr := ginCtx.Param("conference_id")
	conferenceID, err := strconv.ParseInt(conferenceIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid conference_id")
	}

	suggestions, total, err := c.assignmentStorage.GetSuggestionsByConference(ctx, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get suggestions: %w", err)
	}

	return &dto.SuggestionsListResponse{
		Suggestions:      suggestions,
		TotalPapers:      len(suggestions),
		TotalSuggestions: total,
	}, nil
}

// GetConfirmedAssignments lists all confirmed assignments for a conference
// @Summary List confirmed assignments
// @Description Get all confirmed (non-suggested) assignments grouped by submission
// @Tags assignments
// @Produce json
// @Param conference_id path int true "Conference ID"
// @Success 200 {object} dto.ConfirmedAssignmentsListResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/conferences/{conference_id}/assignments/confirmed [get]
func (c *Controller) GetConfirmedAssignments(ginCtx *gin.Context) (*dto.ConfirmedAssignmentsListResponse, error) {
	ctx := ginCtx.Request.Context()

	conferenceIDStr := ginCtx.Param("conference_id")
	conferenceID, err := strconv.ParseInt(conferenceIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid conference_id")
	}

	assignments, total, err := c.assignmentStorage.GetConfirmedAssignmentsByConference(ctx, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get confirmed assignments: %w", err)
	}

	return &dto.ConfirmedAssignmentsListResponse{
		Assignments:      assignments,
		TotalPapers:      len(assignments),
		TotalAssignments: total,
	}, nil
}

// ConfirmSuggestions confirms suggested assignments
// @Summary Confirm assignment suggestions
// @Description Confirm suggested assignments, changing status from 'suggested' to 'pending' and notifying reviewers
// @Tags assignments
// @Accept json
// @Produce json
// @Param conference_id path int true "Conference ID"
// @Param request body dto.ConfirmSuggestionsRequest true "Assignment IDs to confirm (empty for all)"
// @Success 200 {object} dto.ConfirmSuggestionsResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/conferences/{conference_id}/assignments/suggestions/confirm [post]
func (c *Controller) ConfirmSuggestions(ginCtx *gin.Context, req *dto.ConfirmSuggestionsRequest) (*dto.ConfirmSuggestionsResponse, error) {
	ctx := ginCtx.Request.Context()

	conferenceIDStr := ginCtx.Param("conference_id")
	conferenceID, err := strconv.ParseInt(conferenceIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid conference_id")
	}

	// Get suggestions before confirming (for notifications)
	suggestions, _, err := c.assignmentStorage.GetSuggestionsByConference(ctx, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get suggestions: %w", err)
	}

	// Confirm suggestions
	count, err := c.assignmentStorage.ConfirmSuggestions(ctx, conferenceID, req.AssignmentIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to confirm suggestions: %w", err)
	}

	// Update submission status to "reviewing" for confirmed papers
	submissionIDs := make(map[int64]bool)
	for _, sg := range suggestions {
		submissionIDs[sg.SubmissionID] = true
	}
	submissionIDList := make([]int64, 0, len(submissionIDs))
	for id := range submissionIDs {
		submissionIDList = append(submissionIDList, id)
	}
	if len(submissionIDList) > 0 {
		err = c.submissionStorage.BulkUpdateStatus(ctx, submissionIDList, dto.StatusReviewing)
		if err != nil {
			fmt.Printf("Warning: failed to update submission status: %v\n", err)
		}
	}

	// Send notifications to reviewers (async)
	if c.notificationService != nil {
		confID := conferenceID
		assignmentIDs := req.AssignmentIDs
		revStorage := c.reviewerStorage
		subStorage := c.submissionStorage
		notifSvc := c.notificationService
		go func() {
			bgCtx := context.Background()
			for _, sg := range suggestions {
				for _, rev := range sg.Reviewers {
					// Skip if not in the confirmed list (when specific IDs provided)
					if len(assignmentIDs) > 0 {
						found := false
						for _, id := range assignmentIDs {
							if id == rev.AssignmentID {
								found = true
								break
							}
						}
						if !found {
							continue
						}
					}

					// Get reviewer details
					reviewer, err := revStorage.GetByID(bgCtx, rev.ReviewerID)
					if err != nil {
						fmt.Printf("Warning: failed to get reviewer %d: %v\n", rev.ReviewerID, err)
						continue
					}

					// Get submission for title
					submission, err := subStorage.GetByID(bgCtx, sg.SubmissionID)
					if err != nil {
						fmt.Printf("Warning: failed to get submission %d: %v\n", sg.SubmissionID, err)
						continue
					}

					err = notifSvc.NotifyReviewAssigned(
						bgCtx,
						reviewer.Email,
						submission.Title,
						confID,
						sg.SubmissionID,
						rev.AssignmentID,
					)
					if err != nil {
						fmt.Printf("Warning: failed to notify reviewer %s: %v\n", reviewer.Email, err)
					}
				}
			}
		}()
	}

	return &dto.ConfirmSuggestionsResponse{
		ConfirmedCount: count,
		Message:        fmt.Sprintf("Confirmed %d assignments", count),
	}, nil
}

// DeleteSuggestion removes a single suggested assignment
// @Summary Delete a suggestion
// @Description Remove a single suggested reviewer assignment
// @Tags assignments
// @Accept json
// @Produce json
// @Param conference_id path int true "Conference ID"
// @Param assignment_id path int true "Assignment ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /v1/conferences/{conference_id}/assignments/suggestions/{assignment_id} [delete]
func (c *Controller) DeleteSuggestion(ginCtx *gin.Context) error {
	ctx := ginCtx.Request.Context()

	assignmentIDStr := ginCtx.Param("assignment_id")
	assignmentID, err := strconv.ParseInt(assignmentIDStr, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid assignment_id")
	}

	err = c.assignmentStorage.DeleteSuggestion(ctx, assignmentID)
	if err != nil {
		return err
	}

	return nil
}

// AddSuggestion manually adds a suggested reviewer with COI check
// @Summary Add a suggestion
// @Description Manually add a suggested reviewer to a paper with COI warning
// @Tags assignments
// @Accept json
// @Produce json
// @Param conference_id path int true "Conference ID"
// @Param request body dto.AddSuggestionRequest true "Reviewer and submission"
// @Success 200 {object} dto.AddSuggestionResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/conferences/{conference_id}/assignments/suggestions [post]
func (c *Controller) AddSuggestion(ginCtx *gin.Context, req *dto.AddSuggestionRequest) (*dto.AddSuggestionResponse, error) {
	ctx := ginCtx.Request.Context()

	conferenceIDStr := ginCtx.Param("conference_id")
	conferenceID, err := strconv.ParseInt(conferenceIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid conference_id")
	}

	// Check for COI - directly check for self-author conflict
	var coiWarning *dto.COIWarning
	var coiReasons []string

	// Get submission to check author
	submission, err := c.submissionStorage.GetByID(ctx, req.SubmissionID)
	if err == nil && submission != nil {
		// Get reviewer to check email
		reviewer, err := c.reviewerStorage.GetByID(ctx, req.ReviewerID)
		if err == nil && reviewer != nil {
			// Check for self-author COI (reviewer is the paper's author)
			if reviewer.Email == submission.Author {
				coiReasons = append(coiReasons, "Self-author conflict: reviewer is the paper's author")
			}

			// Check for co-author COI
			if submission.Information != nil {
				for _, coAuthor := range submission.Information.CoAuthors {
					if reviewer.Email == coAuthor {
						coiReasons = append(coiReasons, "Co-author conflict: reviewer is a co-author of the paper")
						break
					}
				}

				// Check for declared conflicts
				for _, declared := range submission.Information.DeclaredConflicts {
					if reviewer.Email == declared.Email {
						reason := "Declared conflict"
						if declared.Reason != "" {
							reason += ": " + declared.Reason
						}
						coiReasons = append(coiReasons, reason)
						break
					}
				}
			}
		}
	}

	// Also check assignment service's COI cache if available
	if c.assignmentService != nil {
		coiSvc := c.assignmentService.GetCOIService()
		if coiSvc != nil {
			hasConflict := coiSvc.HasConflict(conferenceID, req.SubmissionID, req.ReviewerID)
			if hasConflict && len(coiReasons) == 0 {
				coiReasons = append(coiReasons, "Conflict of interest detected")
			}
		}
	}

	if len(coiReasons) > 0 {
		coiWarning = &dto.COIWarning{
			HasConflict: true,
			Reasons:     coiReasons,
		}
	}

	// Build metadata for manual suggestion
	coiCheckResults := map[string]string{
		"self_author":        "passed",
		"declared_conflicts": "passed",
		"relationship":       "passed",
	}

	// If any COI was detected, mark the relevant checks
	for _, reason := range coiReasons {
		if strings.Contains(reason, "Self-author") {
			coiCheckResults["self_author"] = "conflict_detected"
		}
		if strings.Contains(reason, "Co-author") || strings.Contains(reason, "Declared") {
			coiCheckResults["declared_conflicts"] = "conflict_detected"
		}
	}

	// Check if relationship detector is available
	if c.assignmentService != nil {
		coiSvc := c.assignmentService.GetCOIService()
		if coiSvc != nil {
			neo4jAvailable := c.assignmentService.GetRelationshipDetector() != nil
			if !neo4jAvailable {
				coiCheckResults["relationship"] = "skipped_neo4j_unavailable"
			}
		}
	}

	meta := &dto.SuggestionMetadata{
		Source:                 "manual",
		MatchedKeywords:        []string{},
		UnmatchedPaperKeywords: []string{},
		ExtraReviewerKeywords:  []string{},
		COIChecks:              coiCheckResults,
		CreatedAt:              time.Now().UTC().Format(time.RFC3339),
	}

	metaJSON, err := json.Marshal(meta)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal suggestion metadata: %w", err)
	}

	// Create assignment with suggested status
	assignmentDTO := &dto.Assignment{
		SubmissionID: req.SubmissionID,
		ReviewerID:   req.ReviewerID,
		Status:       model.AssignmentStatusSuggested,
		Score:        0, // Manual suggestion has no computed score
		Metadata:     metaJSON,
	}

	created, err := c.assignmentStorage.Create(ctx, conferenceID, assignmentDTO)
	if err != nil {
		return nil, fmt.Errorf("failed to create suggestion: %w", err)
	}

	return &dto.AddSuggestionResponse{
		Assignment: created,
		COIWarning: coiWarning,
	}, nil
}

// GetInvitation returns invitation data with persuasive evidence for the reviewer
func (c *Controller) GetInvitation(ginCtx *gin.Context) (*dto.InvitationResponse, error) {
	ctx := ginCtx.Request.Context()

	assignmentIDStr := ginCtx.Param("assignment_id")
	assignmentID, err := strconv.ParseInt(assignmentIDStr, 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid assignment_id")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	assignment, err := c.assignmentStorage.GetByID(ctx, assignmentID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "assignment not found")
	}

	reviewer, err := c.reviewerStorage.GetByID(ctx, assignment.ReviewerID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to get reviewer info")
	}

	if reviewer.Email != userEmail {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "you are not authorized to view this invitation")
	}

	invitation, err := c.assignmentStorage.GetInvitationData(ctx, assignmentID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "invitation not found")
	}

	return invitation, nil
}

// Respond handles reviewer accept/decline of a paper assignment
func (c *Controller) Respond(ginCtx *gin.Context, req *dto.RespondRequest) (*dto.RespondResponse, error) {
	ctx := ginCtx.Request.Context()

	assignmentIDStr := ginCtx.Param("assignment_id")
	assignmentID, err := strconv.ParseInt(assignmentIDStr, 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid assignment_id")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	assignment, err := c.assignmentStorage.GetByID(ctx, assignmentID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "assignment not found")
	}

	if assignment.Status != model.AssignmentStatusPending {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "assignment is not in pending status")
	}

	reviewer, err := c.reviewerStorage.GetByID(ctx, assignment.ReviewerID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to get reviewer info")
	}

	if reviewer.Email != userEmail {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "you are not authorized to respond to this assignment")
	}

	var newStatus string
	if req.Action == "accept" {
		newStatus = model.AssignmentStatusAccepted
	} else {
		newStatus = model.AssignmentStatusDeclined
	}

	err = c.assignmentStorage.RespondToAssignment(ctx, assignmentID, newStatus, req.DeclineCategory, req.DeclineReason)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, fmt.Sprintf("failed to respond: %v", err))
	}

	if c.notificationService != nil {
		confID := assignment.ConferenceID
		subID := assignment.SubmissionID
		revEmail := userEmail
		declineCat := req.DeclineCategory
		declineRsn := req.DeclineReason
		confStorage := c.conferenceStorage
		subStorage := c.submissionStorage
		notifSvc := c.notificationService
		go func() {
			bgCtx := context.Background()
			conference, err := confStorage.GetByID(bgCtx, confID)
			if err != nil {
				fmt.Printf("Warning: Failed to get conference for notification: %v\n", err)
				return
			}
			submission, err := subStorage.GetByID(bgCtx, subID)
			if err != nil {
				fmt.Printf("Warning: Failed to get submission for notification: %v\n", err)
				return
			}
			if conference.Chair != "" {
				if newStatus == model.AssignmentStatusAccepted {
					_ = notifSvc.NotifyAssignmentAccepted(bgCtx, conference.Chair, revEmail, submission.Title, confID)
				} else {
					_ = notifSvc.NotifyAssignmentDeclined(bgCtx, conference.Chair, revEmail, submission.Title, confID, declineCat, declineRsn)
				}
			}
		}()
	}

	message := "Assignment accepted successfully"
	if req.Action == "decline" {
		message = "Assignment declined"
	}

	return &dto.RespondResponse{
		AssignmentID: assignmentID,
		Status:       newStatus,
		Message:      message,
	}, nil
}
