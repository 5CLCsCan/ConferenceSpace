package assignment

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/dcao/conferencespace/internal/assignment"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/dcao/conferencespace/internal/storage"
	assignmentStorage "github.com/dcao/conferencespace/internal/storage/assignment"
	reviewerStorage "github.com/dcao/conferencespace/internal/storage/reviewer"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

// Controller handles assignment-related HTTP requests
type Controller struct {
	assignmentService *assignment.Service
	assignmentStorage assignmentStorage.StorageInterface
	reviewerStorage   reviewerStorage.StorageInterface
}

// New creates a new assignment controller
func New(store *storage.Storage, assignmentService *assignment.Service) *Controller {
	return &Controller{
		assignmentService: assignmentService,
		assignmentStorage: store.Assignment,
		reviewerStorage:   store.Reviewer,
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
		return nil, handler.NewErrorResponse(http.StatusForbidden, "you are not authorized to view this review")
	}

	return assignment, nil
}
