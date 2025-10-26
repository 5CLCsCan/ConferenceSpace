package submission

import (
	"net/http"
	"strconv"

	submissionDto "github.com/dcao/conferencespace/internal/dto/submission"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/storage"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	submissionStorage submissionStorage.StorageInterface
	conferenceStorage conferenceStorage.StorageInterface
}

func New(store *storage.Storage) *Controller {
	return &Controller{
		submissionStorage: store.Submission,
		conferenceStorage:  store.Conference,
	}
}

// Create godoc
// @Summary      Create a new submission
// @Description  Create a new conference submission
// @Tags         submissions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        request body submission.CreateRequest true "Submission data"
// @Success      201 {object} submission.Response
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions [post]
func (c *Controller) Create(ginCtx *gin.Context, req *submissionDto.CreateRequest) (*submissionDto.Response, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	if req.Submission == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "submission data is required")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	req.Submission.Author = userEmail
	req.Submission.ConferenceID = conferenceID

	if req.Submission.Status == "" {
		req.Submission.Status = submissionDto.StatusDraft
	}

	return c.submissionStorage.Create(ctx, req.Submission)
}

// List godoc
// @Summary      List submissions
// @Description  Get list of submissions for a conference with pagination and filters
// @Tags         submissions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        limit query int false "Limit results"
// @Param        offset query int false "Offset for pagination"
// @Param        author query string false "Filter by author"
// @Param        status query string false "Filter by status"
// @Param        title query string false "Filter by title"
// @Success      200 {object} submission.ListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions [get]
func (c *Controller) List(ginCtx *gin.Context, req *submissionDto.ListRequest) (*submissionDto.ListResponse, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	params := &submissionStorage.QueryParams{
		Limit:        req.Limit,
		Offset:       req.Offset,
		ConferenceID: conferenceID,
		Author:       req.Author,
		Status:       req.Status,
		Title:        req.Title,
	}

	submissions, total, err := c.submissionStorage.List(ctx, params)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &submissionDto.ListResponse{
		Submissions: submissions,
		Total:       total,
	}, nil
}

// Get godoc
// @Summary      Get submission by ID
// @Description  Get a specific submission by its ID
// @Tags         submissions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        id path int true "Submission ID"
// @Success      200 {object} submission.Response
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{id} [get]
func (c *Controller) Get(ginCtx *gin.Context) (*submissionDto.Response, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid submission ID")
	}

	submission, err := c.submissionStorage.GetByID(ctx, id)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	if submission.ConferenceID != conferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found in this conference")
	}

	return submission, nil
}

// Update godoc
// @Summary      Update submission
// @Description  Update submission (only if status is draft, only author can update)
// @Tags         submissions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        id path int true "Submission ID"
// @Param        request body submission.UpdateRequest true "Updated submission data"
// @Success      200 {object} submission.Response
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{id} [put]
func (c *Controller) Update(ginCtx *gin.Context, req *submissionDto.UpdateRequest) (*submissionDto.Response, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid submission ID")
	}

	if req.Submission == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "submission data is required")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	existing, err := c.submissionStorage.GetByID(ctx, id)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	if existing.ConferenceID != conferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found in this conference")
	}

	if existing.Author != userEmail {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only the author can update this submission")
	}

	if existing.Status == submissionDto.StatusPublished {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "cannot update published submission")
	}

	req.Submission.Author = userEmail
	req.Submission.ConferenceID = conferenceID

	return c.submissionStorage.Update(ctx, id, req.Submission)
}

// Delete godoc
// @Summary      Delete submission
// @Description  Delete submission (only if status is draft, only author can delete)
// @Tags         submissions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        id path int true "Submission ID"
// @Success      200 {object} map[string]string
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{id} [delete]
func (c *Controller) Delete(ginCtx *gin.Context) error {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid submission ID")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	existing, err := c.submissionStorage.GetByID(ctx, id)
	if err != nil {
		return handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	if existing.ConferenceID != conferenceID {
		return handler.NewErrorResponse(http.StatusNotFound, "submission not found in this conference")
	}

	if existing.Author != userEmail {
		return handler.NewErrorResponse(http.StatusForbidden, "only the author can delete this submission")
	}

	if existing.Status == submissionDto.StatusPublished {
		return handler.NewErrorResponse(http.StatusForbidden, "cannot delete published submission")
	}

	return c.submissionStorage.Delete(ctx, id)
}
