package conference

import (
	"net/http"
	"strconv"

	conferenceDto "github.com/dcao/conferencespace/internal/dto/conference"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/storage"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	conferenceStorage conferenceStorage.StorageInterface
}

func New(store *storage.Storage) *Controller {
	return &Controller{
		conferenceStorage: store.Conference,
	}
}

// Create godoc
// @Summary      Create a new conference
// @Description  Create a new conference (authenticated users only)
// @Tags         conferences
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request body conference.CreateRequest true "Conference data"
// @Success      201 {object} conference.Response
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences [post]
func (c *Controller) Create(ginCtx *gin.Context, req *conferenceDto.CreateRequest) (*conferenceDto.Response, error) {
	ctx := ginCtx.Request.Context()

	if req.Conference == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "conference data is required")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	req.Conference.Chair = userEmail

	return c.conferenceStorage.Create(ctx, req.Conference)
}

// List godoc
// @Summary      List conferences
// @Description  Get list of conferences with pagination and filters
// @Tags         conferences
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        limit query int false "Limit results"
// @Param        offset query int false "Offset for pagination"
// @Param        title query string false "Filter by title"
// @Param        acronym query string false "Filter by acronym"
// @Param        chair query string false "Filter by chair"
// @Success      200 {object} conference.ListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences [get]
func (c *Controller) List(ginCtx *gin.Context, req *conferenceDto.ListRequest) (*conferenceDto.ListResponse, error) {
	ctx := ginCtx.Request.Context()

	params := &conferenceStorage.QueryParams{
		Limit:   req.Limit,
		Offset:  req.Offset,
		Title:   req.Title,
		Acronym: req.Acronym,
		Chair:   req.Chair,
	}

	conferences, total, err := c.conferenceStorage.List(ctx, params)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &conferenceDto.ListResponse{
		Conferences: conferences,
		Total:       total,
	}, nil
}

// Get godoc
// @Summary      Get conference by ID
// @Description  Get a specific conference by its ID
// @Tags         conferences
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Conference ID"
// @Success      200 {object} conference.Response
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{id} [get]
func (c *Controller) Get(ginCtx *gin.Context) (*conferenceDto.Response, error) {
	ctx := ginCtx.Request.Context()

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	conference, err := c.conferenceStorage.GetByID(ctx, id)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}
	return conference, nil
}

// Update godoc
// @Summary      Update conference
// @Description  Update conference (only chair can update)
// @Tags         conferences
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Conference ID"
// @Param        request body conference.UpdateRequest true "Updated conference data"
// @Success      200 {object} conference.Response
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{id} [put]
func (c *Controller) Update(ginCtx *gin.Context, req *conferenceDto.UpdateRequest) (*conferenceDto.Response, error) {
	ctx := ginCtx.Request.Context()

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	if req.Conference == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "conference data is required")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	existing, err := c.conferenceStorage.GetByID(ctx, id)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	if existing.Chair != userEmail {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only the chair can update this conference")
	}

	req.Conference.Chair = userEmail

	return c.conferenceStorage.Update(ctx, id, req.Conference)
}

// Delete godoc
// @Summary      Delete conference
// @Description  Delete conference (only chair can delete)
// @Tags         conferences
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Conference ID"
// @Success      200 {object} map[string]string
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{id} [delete]
func (c *Controller) Delete(ginCtx *gin.Context) error {
	ctx := ginCtx.Request.Context()

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	existing, err := c.conferenceStorage.GetByID(ctx, id)
	if err != nil {
		return handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	if existing.Chair != userEmail {
		return handler.NewErrorResponse(http.StatusForbidden, "only the chair can delete this conference")
	}

	return c.conferenceStorage.Delete(ctx, id)
}
