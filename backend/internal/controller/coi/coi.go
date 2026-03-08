package coi

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	coiService "github.com/dcao/conferencespace/internal/service/coi"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

// Controller handles COI-related HTTP requests
type Controller struct {
	coiService  *coiService.Service
	roleStorage conferenceuserrole.StorageInterface
}

// New creates a new COI controller
func New(coiSvc *coiService.Service, roleStorage conferenceuserrole.StorageInterface) *Controller {
	return &Controller{
		coiService:  coiSvc,
		roleStorage: roleStorage,
	}
}

// GetDashboardStats godoc
// @Summary      Get COI dashboard statistics
// @Description  Retrieves COI dashboard statistics for a specific conference including reviewers, papers, and detected conflicts. Auto-refreshes if data is older than 5 minutes.
// @Tags         coi
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.COIDashboardStats
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /coi/dashboard/stats/{conference_id} [get]
func (c *Controller) GetDashboardStats(ginCtx *gin.Context, req *dto.COIDashboardStatsRequest) (*dto.COIDashboardStats, error) {
	ctx := ginCtx.Request.Context()
	if err := c.requireConferenceAccess(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}

	// RBAC: only chair or co-chair can view COI dashboard
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}
	if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, req.ConferenceID, userEmail) {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only chair can access COI dashboard")
	}

	// Auto-refresh COI data if stale (older than 5 minutes)
	if _, err := c.coiService.AutoRefreshIfNeeded(ctx, req.ConferenceID); err != nil {
		// Log but don't fail - we can still return stale data
		fmt.Printf("Warning: COI auto-refresh failed: %v\n", err)
	}

	stats, err := c.coiService.GetDashboardStats(ctx, req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, fmt.Sprintf("failed to get dashboard stats: %v", err))
	}

	return stats, nil
}

// GetAllRelationships godoc
// @Summary      Get all COI relationships
// @Description  Retrieves all COI relationships for a conference with pagination, filtering by severity, type, and search. Auto-refreshes if data is older than 5 minutes.
// @Tags         coi
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id query int true "Conference ID"
// @Param        severity query string false "Filter by severity (high, medium, low)"
// @Param        relationship_type query string false "Filter by relationship type"
// @Param        search query string false "Search in names, emails, descriptions"
// @Param        limit query int false "Results per page (default: 100)"
// @Param        page query int false "Page number (default: 1)"
// @Success      200 {object} dto.COIRelationshipListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /coi/relationships [get]
func (c *Controller) GetAllRelationships(ginCtx *gin.Context, req *dto.COIRelationshipListRequest) (*dto.COIRelationshipListResponse, error) {
	ctx := ginCtx.Request.Context()

	if req.ConferenceID == 0 {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "conference_id is required")
	}
	if err := c.requireConferenceAccess(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}

	// RBAC: only chair or co-chair can list COI relationships
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}
	if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, req.ConferenceID, userEmail) {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only chair can access COI relationships")
	}

	// Auto-refresh COI data if stale (older than 5 minutes)
	if _, err := c.coiService.AutoRefreshIfNeeded(ctx, req.ConferenceID); err != nil {
		// Log but don't fail - we can still return stale data
		fmt.Printf("Warning: COI auto-refresh failed: %v\n", err)
	}

	response, err := c.coiService.GetAllRelationships(ctx, req)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, fmt.Sprintf("failed to get relationships: %v", err))
	}

	return response, nil
}

// CheckReviewerAuthorCOI godoc
// @Summary      Check COI between reviewer and author
// @Description  Performs detailed COI analysis for a specific reviewer-author pair, returning all detected relationships
// @Tags         coi
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id query int true "Conference ID"
// @Param        reviewer_id path int true "Reviewer ID"
// @Param        author_email path string true "Author Email"
// @Success      200 {object} dto.COIReport
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /coi/check/reviewer/{reviewer_id}/author/{author_email} [get]
func (c *Controller) CheckReviewerAuthorCOI(ginCtx *gin.Context, req *dto.COICheckRequest) (*dto.COIReport, error) {
	ctx := ginCtx.Request.Context()

	// Get conference_id from query parameter
	conferenceIDStr := ginCtx.Query("conference_id")
	if conferenceIDStr == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "conference_id query parameter is required")
	}

	conferenceID, err := strconv.ParseInt(conferenceIDStr, 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference_id")
	}
	if err := c.requireConferenceAccess(ginCtx, conferenceID); err != nil {
		return nil, err
	}

	// Keep pair checks aligned with the latest computed relationships.
	if _, err := c.coiService.AutoRefreshIfNeeded(ctx, conferenceID); err != nil {
		fmt.Printf("Warning: COI auto-refresh failed: %v\n", err)
	}

	report, err := c.coiService.CheckReviewerAuthorCOI(ctx, conferenceID, req.ReviewerID, req.AuthorEmail)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, fmt.Sprintf("failed to check COI: %v", err))
	}

	return report, nil
}

// GetPaperCOIs godoc
// @Summary      Get COI summaries for all papers
// @Description  Retrieves COI summaries grouped by paper, showing which reviewers have conflicts with each paper. Auto-refreshes if data is older than 5 minutes.
// @Tags         coi
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id query int true "Conference ID"
// @Param        severity query string false "Filter by minimum severity level"
// @Param        search query string false "Search paper titles or author names"
// @Param        limit query int false "Results per page (default: 10)"
// @Param        page query int false "Page number (default: 1)"
// @Success      200 {object} dto.PaperCOIListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /coi/papers [get]
func (c *Controller) GetPaperCOIs(ginCtx *gin.Context, req *dto.PaperCOIListRequest) (*dto.PaperCOIListResponse, error) {
	ctx := ginCtx.Request.Context()

	if req.ConferenceID == 0 {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "conference_id is required")
	}
	if err := c.requireConferenceAccess(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}

	// RBAC: only chair or co-chair can view COI paper summaries
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}
	if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, req.ConferenceID, userEmail) {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only chair can access COI paper summaries")
	}

	// Auto-refresh COI data if stale (older than 5 minutes)
	if _, err := c.coiService.AutoRefreshIfNeeded(ctx, req.ConferenceID); err != nil {
		// Log but don't fail - we can still return stale data
		fmt.Printf("Warning: COI auto-refresh failed: %v\n", err)
	}

	response, err := c.coiService.GetPaperCOISummaries(ctx, req)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, fmt.Sprintf("failed to get paper COIs: %v", err))
	}

	return response, nil
}

// RebuildCOI godoc
// @Summary      Rebuild COI relationships
// @Description  Triggers re-detection of COI relationships for a conference (admin only)
// @Tags         coi
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.COIRebuildResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /coi/conferences/{conference_id}/rebuild [post]
func (c *Controller) RebuildCOI(ginCtx *gin.Context, req *dto.COIRebuildRequest) (*dto.COIRebuildResponse, error) {
	ctx := ginCtx.Request.Context()
	if err := c.requireConferenceAccess(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}

	// RBAC: only chair or co-chair can rebuild COI
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}
	if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, req.ConferenceID, userEmail) {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only chair can rebuild COI")
	}

	// Start timing
	startTime := time.Now()

	// Build and store relationships
	count, err := c.coiService.BuildAndStoreRelationships(ctx, req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, fmt.Sprintf("failed to rebuild COI: %v", err))
	}

	// Calculate elapsed time
	elapsedMs := time.Since(startTime).Milliseconds()

	return &dto.COIRebuildResponse{
		ConferenceID:        req.ConferenceID,
		RelationshipsFound:  count,
		RelationshipsStored: count,
		DetectionTimeMs:     elapsedMs,
	}, nil
}

func (c *Controller) requireConferenceAccess(ginCtx *gin.Context, conferenceID int64) error {
	ctx := ginCtx.Request.Context()

	if isAdmin, exists := ginCtx.Get("is_admin"); exists {
		if adminValue, ok := isAdmin.(bool); ok && adminValue {
			return nil
		}
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, conferenceID, userEmail) {
		return handler.NewErrorResponse(http.StatusForbidden, "only conference chairs can access COI management operations")
	}

	return nil
}
