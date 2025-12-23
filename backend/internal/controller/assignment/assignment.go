package assignment

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/dcao/conferencespace/internal/assignment"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	coiService "github.com/dcao/conferencespace/internal/service/coi"
	notificationService "github.com/dcao/conferencespace/internal/service/notification"
	"github.com/dcao/conferencespace/internal/storage"
	assignmentStorage "github.com/dcao/conferencespace/internal/storage/assignment"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
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
	conferenceStorage   conferenceStorage.StorageInterface
	notificationService *notificationService.Service
	coiService          *coiService.Service
}

// New creates a new assignment controller
func New(store *storage.Storage, assignmentService *assignment.Service, coiSvc *coiService.Service) *Controller {
	return &Controller{
		assignmentService: assignmentService,
		assignmentStorage: store.Assignment,
		reviewerStorage:   store.Reviewer,
		submissionStorage: store.Submission,
		conferenceStorage: store.Conference,
		coiService:        coiSvc,
	}
}

// NewWithNotifications creates a new assignment controller with notification support
func NewWithNotifications(store *storage.Storage, assignmentService *assignment.Service, notifSvc *notificationService.Service, coiSvc *coiService.Service) *Controller {
	return &Controller{
		assignmentService:   assignmentService,
		assignmentStorage:   store.Assignment,
		reviewerStorage:     store.Reviewer,
		submissionStorage:   store.Submission,
		conferenceStorage:   store.Conference,
		notificationService: notifSvc,
		coiService:          coiSvc,
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

	// Store COI relationships in database (only if not a dry run)
	// This enables the COI dashboard without manually calling rebuild
	if !req.DryRun && c.coiService != nil {
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

	// Send notifications to assigned reviewers (only if not a dry run)
	if c.notificationService != nil && !req.DryRun {
		// Capture values for goroutine (use background context since request context will be cancelled)
		assignments := result.Assignments
		confID := conferenceID
		revStorage := c.reviewerStorage
		subStorage := c.submissionStorage
		notifSvc := c.notificationService
		go func() {
			bgCtx := context.Background()
			for _, assign := range assignments {
				// Get reviewer email
				reviewer, err := revStorage.GetByID(bgCtx, assign.ReviewerID)
				if err != nil {
					fmt.Printf("Warning: Failed to get reviewer for notification: %v\n", err)
					continue
				}

				// Get submission title
				submission, err := subStorage.GetByID(bgCtx, assign.SubmissionID)
				if err != nil {
					fmt.Printf("Warning: Failed to get submission for notification: %v\n", err)
					continue
				}

				err = notifSvc.NotifyReviewAssigned(
					bgCtx,
					reviewer.Email,
					submission.Title,
					confID,
					assign.SubmissionID,
					assign.ID,
				)
				if err != nil {
					fmt.Printf("Warning: Failed to notify reviewer about assignment: %v\n", err)
				}
			}
		}()
	}

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

	// CRITICAL: Extract authenticated user email
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	// CRITICAL: Fetch assignment and verify reviewer ownership
	assignment, err := c.assignmentStorage.GetByID(ctx, req.AssignmentID)
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
		return nil, handler.NewErrorResponse(http.StatusForbidden, "you are not authorized to review this submission")
	}

	// Check if review is already submitted (cannot edit submitted reviews)
	if assignment.ReviewStatus != nil && *assignment.ReviewStatus == model.ReviewStatusSubmitted {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "cannot edit a submitted review")
	}

	// Validation for submitted reviews
	if req.Status == model.ReviewStatusSubmitted {
		if req.ReviewScore == nil {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, "review_score is required for submitted reviews")
		}
		if req.ReviewData == nil {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, "review_data is required for submitted reviews")
		}
		if req.ReviewData.Feedback.Strengths == "" {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, "feedback strengths is required for submitted reviews")
		}

		// Validate score range
		if *req.ReviewScore < 0.0 || *req.ReviewScore > 10.0 {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, "review_score must be between 0.00 and 10.00")
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
		// return nil, handler.NewErrorResponse(http.StatusForbidden, "you are not authorized to view this review")
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

	// Use :id from path as submission ID
	submissionIDStr := ginCtx.Param("id")
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
	submissionIDStr := ginCtx.Param("id")
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
