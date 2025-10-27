package conference

import (
	"net/http"

	"github.com/dcao/conferencespace/internal/dto"
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
func (c *Controller) Create(ginCtx *gin.Context, req *dto.ConferenceCreateRequest) (*dto.ConferenceResponse, error) {
	ctx := ginCtx.Request.Context()

	if req.Conference == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "conference data is required")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	userID, exists := utils.GetUserID(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	req.Conference.Chair = userEmail
	req.Conference.PrimaryContact = userID
	req.Conference.AreaChair = userID

	return c.conferenceStorage.Create(ctx, req.Conference)
}

// List godoc
// @Summary      List conferences
// @Description  Get list of conferences with pagination and filters and user role information
// @Tags         conferences
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        limit query int false "Limit results"
// @Param        offset query int false "Offset for pagination"
// @Param        title query string false "Filter by title"
// @Param        acronym query string false "Filter by acronym"
// @Param        chair query string false "Filter by chair"
// @Success      200 {object} conference.UserListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences [get]
func (c *Controller) List(ginCtx *gin.Context, req *dto.ConferenceListRequest) (*dto.UserConferenceListResponse, error) {
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

	// Get current user for role determination
	userID, exists := utils.GetUserID(ginCtx)
	userEmail, _ := utils.GetEmail(ginCtx)

	// Convert to user-specific response with role information
	userConferences := make([]*dto.UserConferenceResponse, len(conferences))
	for i, conf := range conferences {
		userConf := &dto.UserConferenceResponse{
			ConferenceResponse: *conf,
			UserRole:           "", // Default: no role
		}

		// Determine user role if user context is available
		if exists {
			// Check if user is chair
			if userEmail == conf.Chair || (userID > 0 && (userID == conf.PrimaryContact || userID == conf.AreaChair)) {
				userConf.UserRole = "chair"
			}
			// TODO: Check if user is author (has submissions to this conference)
			// TODO: Check if user is reviewer (assigned to review this conference)
		}

		userConferences[i] = userConf
	}

	return &dto.UserConferenceListResponse{
		Conferences: userConferences,
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
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} conference.Response
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id} [get]
func (c *Controller) Get(ginCtx *gin.Context, req *dto.ConferenceGetRequest) (*dto.ConferenceResponse, error) {
	ctx := ginCtx.Request.Context()

	conference, err := c.conferenceStorage.GetByID(ctx, req.ConferenceID)
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
// @Param        conference_id path int true "Conference ID"
// @Param        request body conference.UpdateRequest true "Updated conference data"
// @Success      200 {object} conference.Response
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id} [put]
func (c *Controller) Update(ginCtx *gin.Context, req *dto.ConferenceUpdateRequest) (*dto.ConferenceResponse, error) {
	ctx := ginCtx.Request.Context()

	if req.Conference == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "conference data is required")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	existing, err := c.conferenceStorage.GetByID(ctx, req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	if existing.Chair != userEmail {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only the chair can update this conference")
	}

	req.Conference.Chair = userEmail

	return c.conferenceStorage.Update(ctx, req.ConferenceID, req.Conference)
}

// Delete godoc
// @Summary      Delete conference
// @Description  Delete conference (only chair can delete)
// @Tags         conferences
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} map[string]string
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id} [delete]
func (c *Controller) Delete(ginCtx *gin.Context, req *dto.ConferenceDeleteRequest) error {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	existing, err := c.conferenceStorage.GetByID(ctx, req.ConferenceID)
	if err != nil {
		return handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	if existing.Chair != userEmail {
		return handler.NewErrorResponse(http.StatusForbidden, "only the chair can delete this conference")
	}

	return c.conferenceStorage.Delete(ctx, req.ConferenceID)
}
