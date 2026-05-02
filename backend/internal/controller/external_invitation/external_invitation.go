package external_invitation

import (
	"net/http"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	externalinvitationStorage "github.com/dcao/conferencespace/internal/storage/external_invitation"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	store externalinvitationStorage.StorageInterface
}

func New(store externalinvitationStorage.StorageInterface) *Controller {
	return &Controller{store: store}
}

// BatchCreate godoc
// @Summary      Create external invitation(s)
// @Description  Invite external (non-platform) users to a conference
// @Tags         external-invitations
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        request body dto.ExternalInvitationBatchCreateRequest true "Invitations to create"
// @Success      201 {object} dto.ExternalInvitationBatchCreateResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/external-invitations [post]
func (c *Controller) BatchCreate(ginCtx *gin.Context, req *dto.ExternalInvitationBatchCreateRequest) (*dto.ExternalInvitationBatchCreateResponse, error) {
	ctx := ginCtx.Request.Context()

	userID, exists := utils.GetUserID(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	if len(req.Invitations) == 0 {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "at least one invitation must be provided")
	}

	result, err := c.store.BatchCreate(ctx, req.ConferenceID, userID, req.Invitations)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return result, nil
}

// List godoc
// @Summary      List external invitations for a conference
// @Description  Get all external invitations with optional role filter and pagination
// @Tags         external-invitations
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        limit query int false "Limit (default 20)"
// @Param        offset query int false "Offset"
// @Param        role query string false "Filter by role (pc, reviewer)"
// @Success      200 {object} dto.ExternalInvitationListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/external-invitations [get]
func (c *Controller) List(ginCtx *gin.Context, req *dto.ExternalInvitationListRequest) (*dto.ExternalInvitationListResponse, error) {
	ctx := ginCtx.Request.Context()

	if req.Limit == 0 {
		req.Limit = 20
	}

	invitations, total, err := c.store.List(ctx, req.ConferenceID, &externalinvitationStorage.ListParams{
		Limit:  req.Limit,
		Offset: req.Offset,
		Role:   req.Role,
	})
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &dto.ExternalInvitationListResponse{
		Invitations: invitations,
		Total:       total,
		Limit:       req.Limit,
		Offset:      req.Offset,
	}, nil
}

// Delete godoc
// @Summary      Delete an external invitation
// @Description  Remove an external invitation from a conference
// @Tags         external-invitations
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        id path int true "External Invitation ID"
// @Success      200 {object} map[string]string
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/external-invitations/{id} [delete]
func (c *Controller) Delete(ginCtx *gin.Context, req *dto.ExternalInvitationDeleteRequest) error {
	ctx := ginCtx.Request.Context()

	if err := c.store.Delete(ctx, req.ID, req.ConferenceID); err != nil {
		return handler.NewErrorResponse(http.StatusNotFound, "external invitation not found")
	}

	return nil
}
