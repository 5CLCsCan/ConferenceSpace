package reviewer

import (
	"net/http"
	"strconv"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/storage"
	reviewerStorage "github.com/dcao/conferencespace/internal/storage/reviewer"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	reviewerStorage reviewerStorage.StorageInterface
}

func New(store *storage.Storage) *Controller {
	return &Controller{
		reviewerStorage: store.Reviewer,
	}
}

// BatchInvite godoc
// @Summary      Invite reviewers to a conference
// @Description  Invite multiple reviewers to a conference (batch operation)
// @Tags         reviewers
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Conference ID"
// @Param        request body dto.ReviewerBatchInviteRequest true "List of reviewers to invite"
// @Success      201 {object} dto.ReviewerBatchInviteResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{id}/reviewers [post]
func (c *Controller) BatchInvite(ginCtx *gin.Context, req *dto.ReviewerBatchInviteRequest) (*dto.ReviewerBatchInviteResponse, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	if len(req.Reviewers) == 0 {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "at least one reviewer must be provided")
	}

	result, err := c.reviewerStorage.BatchCreate(ctx, conferenceID, req.Reviewers)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return result, nil
}

// List godoc
// @Summary      List reviewers for a conference
// @Description  Get all reviewers for a conference with pagination and optional status filter
// @Tags         reviewers
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Conference ID"
// @Param        limit query int false "Limit results (default: 20)"
// @Param        offset query int false "Offset for pagination"
// @Param        status query string false "Filter by status (pending, accepted, rejected)"
// @Success      200 {object} dto.ReviewerListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{id}/reviewers [get]
func (c *Controller) List(ginCtx *gin.Context, req *dto.ReviewerListRequest) (*dto.ReviewerListResponse, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	// Set default limit if not specified
	if req.Limit == 0 {
		req.Limit = 20
	}

	params := &reviewerStorage.ListParams{
		Limit:  req.Limit,
		Offset: req.Offset,
		Status: req.Status,
	}

	reviewers, total, err := c.reviewerStorage.List(ctx, conferenceID, params)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &dto.ReviewerListResponse{
		Reviewers: reviewers,
		Total:     total,
		Limit:     req.Limit,
		Offset:    req.Offset,
	}, nil
}

// Get godoc
// @Summary      Get reviewer by ID
// @Description  Get a specific reviewer invitation
// @Tags         reviewers
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Conference ID"
// @Param        reviewer_id path int true "Reviewer ID"
// @Success      200 {object} dto.Reviewer
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{id}/reviewers/{reviewer_id} [get]
func (c *Controller) Get(ginCtx *gin.Context) (*dto.Reviewer, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	reviewerID, err := strconv.ParseInt(ginCtx.Param("reviewer_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid reviewer ID")
	}

	reviewer, err := c.reviewerStorage.GetByID(ctx, reviewerID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "reviewer not found")
	}

	// Verify the reviewer belongs to the specified conference
	if reviewer.ConferenceID != conferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "reviewer not found in this conference")
	}

	return reviewer, nil
}

// UpdateStatus godoc
// @Summary      Update reviewer status
// @Description  Update the status of a reviewer invitation (accept/reject)
// @Tags         reviewers
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Conference ID"
// @Param        reviewer_id path int true "Reviewer ID"
// @Param        request body dto.ReviewerUpdateStatusRequest true "New status"
// @Success      200 {object} dto.Reviewer
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{id}/reviewers/{reviewer_id}/status [put]
func (c *Controller) UpdateStatus(ginCtx *gin.Context, req *dto.ReviewerUpdateStatusRequest) (*dto.Reviewer, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	reviewerID, err := strconv.ParseInt(ginCtx.Param("reviewer_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid reviewer ID")
	}

	// Verify the reviewer exists and belongs to this conference
	existing, err := c.reviewerStorage.GetByID(ctx, reviewerID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "reviewer not found")
	}

	if existing.ConferenceID != conferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "reviewer not found in this conference")
	}

	result, err := c.reviewerStorage.UpdateStatus(ctx, reviewerID, req.Status)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return result, nil
}

// Delete godoc
// @Summary      Delete reviewer invitation
// @Description  Remove a reviewer from a conference
// @Tags         reviewers
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Conference ID"
// @Param        reviewer_id path int true "Reviewer ID"
// @Success      200 {object} map[string]string
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{id}/reviewers/{reviewer_id} [delete]
func (c *Controller) Delete(ginCtx *gin.Context) error {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	reviewerID, err := strconv.ParseInt(ginCtx.Param("reviewer_id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid reviewer ID")
	}

	// Verify the reviewer exists and belongs to this conference
	existing, err := c.reviewerStorage.GetByID(ctx, reviewerID)
	if err != nil {
		return handler.NewErrorResponse(http.StatusNotFound, "reviewer not found")
	}

	if existing.ConferenceID != conferenceID {
		return handler.NewErrorResponse(http.StatusNotFound, "reviewer not found in this conference")
	}

	if err := c.reviewerStorage.Delete(ctx, reviewerID); err != nil {
		return handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return nil
}
