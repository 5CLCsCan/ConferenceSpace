package reviewer

import (
	"net/http"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

// postRebuttalScoreResponse is the response for UpdatePostRebuttalScore.
type postRebuttalScoreResponse struct {
	Message string `json:"message"`
}

// UpdatePostRebuttalScore godoc
// @Summary      Reviewer updates their score after reading the rebuttal
// @Tags         reviewers
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        assignment_id path int true "Assignment ID"
// @Param        request body dto.PostRebuttalScoreRequest true "Score data"
// @Success      200 {object} postRebuttalScoreResponse
// @Router       /conferences/{conference_id}/assignments/{assignment_id}/post-rebuttal-score [put]
func (c *Controller) UpdatePostRebuttalScore(ginCtx *gin.Context, req *dto.PostRebuttalScoreRequest) (*postRebuttalScoreResponse, error) {
	ctx := ginCtx.Request.Context()

	email, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "not authenticated")
	}

	// Verify the calling user owns this assignment
	assignment, err := c.assignmentStorage.GetByID(ctx, req.AssignmentID)
	if err != nil || assignment.ConferenceID != req.ConferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "assignment not found")
	}

	// Look up the reviewer record to get email
	reviewer, err := c.reviewerStorage.GetByID(ctx, assignment.ReviewerID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "reviewer not found")
	}
	if reviewer.Email != email {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "you can only update your own post-rebuttal score")
	}

	if err := c.assignmentStorage.UpdatePostRebuttalScore(ctx, req.AssignmentID, req); err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &postRebuttalScoreResponse{Message: "post-rebuttal score updated"}, nil
}
