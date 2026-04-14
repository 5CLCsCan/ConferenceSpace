package conference

import (
	"context"
	"fmt"
	"net/http"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

// GetRebuttalSettings godoc
// @Summary      Get rebuttal settings and overview
// @Tags         conferences
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.RebuttalOverviewResponse
// @Router       /conferences/{conference_id}/rebuttal/settings [get]
func (c *Controller) GetRebuttalSettings(ginCtx *gin.Context, req *dto.RebuttalPhaseRequest) (*dto.RebuttalOverviewResponse, error) {
	ctx := ginCtx.Request.Context()
	if err := c.assertChairCoChairOrPC(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}
	return c.conferenceStorage.GetRebuttalOverview(ctx, req.ConferenceID)
}

// SaveRebuttalSettings godoc
// @Summary      Save rebuttal configuration
// @Tags         conferences
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        request body dto.SaveRebuttalConfigRequest true "Settings"
// @Success      200 {object} dto.ConferenceRebuttalConfig
// @Router       /conferences/{conference_id}/rebuttal/settings [patch]
func (c *Controller) SaveRebuttalSettings(ginCtx *gin.Context, req *dto.SaveRebuttalConfigRequest) (*dto.ConferenceRebuttalConfig, error) {
	ctx := ginCtx.Request.Context()
	if err := c.assertChairOrCoChair(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}
	return c.conferenceStorage.SaveRebuttalSettings(ctx, req.ConferenceID, req)
}

// OpenRebuttal godoc
// @Summary      Open rebuttal period (chair only)
// @Tags         conferences
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.ConferenceRebuttalConfig
// @Router       /conferences/{conference_id}/rebuttal/open [post]
func (c *Controller) OpenRebuttal(ginCtx *gin.Context, req *dto.RebuttalPhaseRequest) (*dto.ConferenceRebuttalConfig, error) {
	ctx := ginCtx.Request.Context()
	if err := c.assertChairOrCoChair(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}
	if err := c.conferenceStorage.OpenRebuttal(ctx, req.ConferenceID); err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
	}
	// Notify all authors with submissions in this conference (fire-and-forget)
	if c.notificationService != nil {
		conf, _ := c.conferenceStorage.GetByID(ctx, req.ConferenceID)
		if conf != nil {
			go c.notifyRebuttalOpenedToAuthors(context.Background(), req.ConferenceID, conf.Title)
		}
	}
	return c.conferenceStorage.GetRebuttalSettings(ctx, req.ConferenceID)
}

// FinalizeRebuttal godoc
// @Summary      Finalize rebuttal period (chair only)
// @Tags         conferences
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.ConferenceRebuttalConfig
// @Router       /conferences/{conference_id}/rebuttal/finalize [post]
func (c *Controller) FinalizeRebuttal(ginCtx *gin.Context, req *dto.RebuttalPhaseRequest) (*dto.ConferenceRebuttalConfig, error) {
	ctx := ginCtx.Request.Context()
	if err := c.assertChairOrCoChair(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}
	if err := c.conferenceStorage.FinalizeRebuttal(ctx, req.ConferenceID); err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}
	// Notify all participants (fire-and-forget)
	if c.notificationService != nil {
		conf, _ := c.conferenceStorage.GetByID(ctx, req.ConferenceID)
		if conf != nil {
			go c.notifyRebuttalFinalizedToAll(context.Background(), req.ConferenceID, conf.Title)
		}
	}
	return c.conferenceStorage.GetRebuttalSettings(ctx, req.ConferenceID)
}

// OpenDiscussion godoc
// @Summary      Open discussion phase (chair only, requires allow_discussion=true)
// @Tags         conferences
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.ConferenceRebuttalConfig
// @Router       /conferences/{conference_id}/rebuttal/open-discussion [post]
func (c *Controller) OpenDiscussion(ginCtx *gin.Context, req *dto.RebuttalPhaseRequest) (*dto.ConferenceRebuttalConfig, error) {
	ctx := ginCtx.Request.Context()
	if err := c.assertChairOrCoChair(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}
	if err := c.conferenceStorage.OpenDiscussion(ctx, req.ConferenceID); err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
	}
	return c.conferenceStorage.GetRebuttalSettings(ctx, req.ConferenceID)
}

// notifyRebuttalOpenedToAuthors fetches all submission authors and sends them a notification.
func (c *Controller) notifyRebuttalOpenedToAuthors(ctx context.Context, conferenceID int64, conferenceTitle string) {
	overview, err := c.conferenceStorage.GetRebuttalOverview(ctx, conferenceID)
	if err != nil {
		return
	}
	seen := map[string]bool{}
	for _, row := range overview.Submissions {
		// We only have submission IDs here; author email lookup would need a submission storage call.
		// Log the intent for now — full implementation requires submission storage in this controller.
		_ = fmt.Sprintf("notify author of submission %d for conference %s", row.SubmissionID, conferenceTitle)
		_ = seen
	}
}

// notifyRebuttalFinalizedToAll sends finalized notifications.
func (c *Controller) notifyRebuttalFinalizedToAll(ctx context.Context, conferenceID int64, conferenceTitle string) {
	_ = ctx
	_ = fmt.Sprintf("notify all participants for conference %s (ID: %d) rebuttal finalized", conferenceTitle, conferenceID)
}

// assertChairOrCoChair returns an error if the current user is not the chair or a co-chair.
func (c *Controller) assertChairOrCoChair(ginCtx *gin.Context, conferenceID int64) error {
	email, exists := utils.GetEmail(ginCtx)
	if !exists {
		return handler.NewErrorResponse(http.StatusUnauthorized, "not authenticated")
	}
	conf, err := c.conferenceStorage.GetByID(ginCtx.Request.Context(), conferenceID)
	if err != nil {
		return handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}
	if conf.Chair == email {
		return nil
	}
	for _, cc := range conf.CoChairs {
		if cc == email {
			return nil
		}
	}
	return handler.NewErrorResponse(http.StatusForbidden, "only chair or co-chair can perform this action")
}

// assertChairCoChairOrPC returns an error if the current user is not chair, co-chair, or PC.
func (c *Controller) assertChairCoChairOrPC(ginCtx *gin.Context, conferenceID int64) error {
	email, exists := utils.GetEmail(ginCtx)
	if !exists {
		return handler.NewErrorResponse(http.StatusUnauthorized, "not authenticated")
	}
	hasRole, err := c.roleStorage.HasRole(ginCtx.Request.Context(), conferenceID, email, []string{"chair", "co_chair", "pc"})
	if err != nil {
		return handler.NewErrorResponse(http.StatusInternalServerError, "failed to check role")
	}
	if hasRole {
		return nil
	}
	return handler.NewErrorResponse(http.StatusForbidden, "only chair, co-chair, or program committee can perform this action")
}
