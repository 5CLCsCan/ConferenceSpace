package assignment

import (
	"fmt"
	"strconv"

	"github.com/dcao/conferencespace/internal/assignment"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/gin-gonic/gin"
)

// Controller handles assignment-related HTTP requests
type Controller struct {
	assignmentService *assignment.Service
}

// New creates a new assignment controller
func New(assignmentService *assignment.Service) *Controller {
	return &Controller{
		assignmentService: assignmentService,
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
