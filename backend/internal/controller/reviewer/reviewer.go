package reviewer

import (
	"net/http"

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
// @Param        conference_id path int true "Conference ID"
// @Param        request body dto.ReviewerBatchInviteRequest true "List of reviewers to invite"
// @Success      201 {object} dto.ReviewerBatchInviteResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/reviewers [post]
func (c *Controller) BatchInvite(ginCtx *gin.Context, req *dto.ReviewerBatchInviteRequest) (*dto.ReviewerBatchInviteResponse, error) {
	ctx := ginCtx.Request.Context()

	if len(req.Reviewers) == 0 {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "at least one reviewer must be provided")
	}

	result, err := c.reviewerStorage.BatchCreate(ctx, req.ConferenceID, req.Reviewers)
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
// @Param        conference_id path int true "Conference ID"
// @Param        limit query int false "Limit results (default: 20)"
// @Param        offset query int false "Offset for pagination"
// @Param        status query string false "Filter by status (pending, accepted, rejected)"
// @Success      200 {object} dto.ReviewerListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/reviewers [get]
func (c *Controller) List(ginCtx *gin.Context, req *dto.ReviewerListRequest) (*dto.ReviewerListResponse, error) {
	ctx := ginCtx.Request.Context()

	// Set default limit if not specified
	if req.Limit == 0 {
		req.Limit = 20
	}

	params := &reviewerStorage.ListParams{
		Limit:  req.Limit,
		Offset: req.Offset,
		Status: req.Status,
	}

	reviewers, total, err := c.reviewerStorage.List(ctx, req.ConferenceID, params)
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
// @Param        conference_id path int true "Conference ID"
// @Param        reviewer_id path int true "Reviewer ID"
// @Success      200 {object} dto.Reviewer
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/reviewers/{reviewer_id} [get]
func (c *Controller) Get(ginCtx *gin.Context, req *dto.ReviewerGetRequest) (*dto.Reviewer, error) {
	ctx := ginCtx.Request.Context()

	reviewer, err := c.reviewerStorage.GetByID(ctx, req.ReviewerID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "reviewer not found")
	}

	// Verify the reviewer belongs to the specified conference
	if reviewer.ConferenceID != req.ConferenceID {
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
// @Param        conference_id path int true "Conference ID"
// @Param        reviewer_id path int true "Reviewer ID"
// @Param        request body dto.ReviewerUpdateStatusRequest true "New status"
// @Success      200 {object} dto.Reviewer
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/reviewers/{reviewer_id}/status [put]
func (c *Controller) UpdateStatus(ginCtx *gin.Context, req *dto.ReviewerUpdateStatusRequest) (*dto.Reviewer, error) {
	ctx := ginCtx.Request.Context()

	// Verify the reviewer exists and belongs to this conference
	existing, err := c.reviewerStorage.GetByID(ctx, req.ReviewerID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "reviewer not found")
	}

	if existing.ConferenceID != req.ConferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "reviewer not found in this conference")
	}

	result, err := c.reviewerStorage.UpdateStatus(ctx, req.ReviewerID, req.Status)
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
// @Param        conference_id path int true "Conference ID"
// @Param        reviewer_id path int true "Reviewer ID"
// @Success      200 {object} map[string]string
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/reviewers/{reviewer_id} [delete]
func (c *Controller) Delete(ginCtx *gin.Context, req *dto.ReviewerDeleteRequest) error {
	ctx := ginCtx.Request.Context()

	// Verify the reviewer exists and belongs to this conference
	existing, err := c.reviewerStorage.GetByID(ctx, req.ReviewerID)
	if err != nil {
		return handler.NewErrorResponse(http.StatusNotFound, "reviewer not found")
	}

	if existing.ConferenceID != req.ConferenceID {
		return handler.NewErrorResponse(http.StatusNotFound, "reviewer not found in this conference")
	}

	if err := c.reviewerStorage.Delete(ctx, req.ReviewerID); err != nil {
		return handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return nil
}

// ================== Reviewer Dashboard Controllers ==================

// GetDashboard godoc
// @Summary      Get reviewer dashboard data with pagination
// @Description  Get all data needed for reviewer dashboard (conferences, stats, invitations, recent assignments) with optional pagination
// @Tags         reviewers
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        reviewer_id path int true "Reviewer User ID"
// @Param        conference_limit query int false "Limit conferences (default: 10)"
// @Param        conference_offset query int false "Offset conferences"
// @Param        conference_search query string false "Search conferences by name"
// @Param        invitation_limit query int false "Limit invitations (default: 10)"
// @Param        invitation_offset query int false "Offset invitations"
// @Param        recent_assignment_limit query int false "Limit recent assignments (default: 5)"
// @Success      200 {object} dto.ReviewerDashboardResponseWithPagination
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /reviewer/{reviewer_id}/dashboard [get]
func (c *Controller) GetDashboard(ginCtx *gin.Context, req *dto.GetDashboardRequest) (*dto.ReviewerDashboardResponseWithPagination, error) {
	ctx := ginCtx.Request.Context()

	// Set defaults for pagination
	if req.ConferenceLimit == 0 {
		req.ConferenceLimit = 10
	}
	if req.InvitationLimit == 0 {
		req.InvitationLimit = 10
	}
	if req.RecentAssignmentLimit == 0 {
		req.RecentAssignmentLimit = 5
	}

	// Fetch all data in parallel for better performance
	type result struct {
		conferences      []*dto.ReviewerConference
		conferencesTotal int64
		stats            *dto.ReviewerStats
		invitations      []*dto.ReviewInvitation
		invitationsTotal int64
		assignments      []*dto.AssignmentWithPaper
		assignmentsTotal int64
		err              error
	}

	resultChan := make(chan result, 1)

	go func() {
		var r result
		// Get conferences with pagination
		r.conferences, r.conferencesTotal, r.err = c.reviewerStorage.GetConferencesByReviewer(ctx, req.ReviewerID, &reviewerStorage.ConferenceListParams{
			Limit:  req.ConferenceLimit,
			Offset: req.ConferenceOffset,
			Search: req.ConferenceSearch,
		})
		if r.err != nil {
			resultChan <- r
			return
		}

		// Get stats
		r.stats, r.err = c.reviewerStorage.GetReviewerStats(ctx, req.ReviewerID)
		if r.err != nil {
			resultChan <- r
			return
		}

		// Get invitations with pagination and status filter
		r.invitations, r.invitationsTotal, r.err = c.reviewerStorage.GetPendingInvitations(ctx, req.ReviewerID, &reviewerStorage.InvitationListParams{
			Limit:  req.InvitationLimit,
			Offset: req.InvitationOffset,
			Status: req.InvitationStatus,
		})
		if r.err != nil {
			resultChan <- r
			return
		}

		// Get recent assignments with pagination
		r.assignments, r.assignmentsTotal, r.err = c.reviewerStorage.GetRecentAssignments(ctx, req.ReviewerID, req.RecentAssignmentLimit, req.RecentAssignmentOffset)
		if r.err != nil {
			resultChan <- r
			return
		}

		resultChan <- r
	}()

	r := <-resultChan
	if r.err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, r.err.Error())
	}

	// Ensure non-nil slices for consistent API response
	conferences := r.conferences
	if conferences == nil {
		conferences = []*dto.ReviewerConference{}
	}
	
	invitations := r.invitations
	if invitations == nil {
		invitations = []*dto.ReviewInvitation{}
	}
	
	assignments := r.assignments
	if assignments == nil {
		assignments = []*dto.AssignmentWithPaper{}
	}

	// Return response with pagination totals
	response := &dto.ReviewerDashboardResponseWithPagination{}
	response.Conferences.Data = conferences
	response.Conferences.Total = r.conferencesTotal
	response.Conferences.Limit = req.ConferenceLimit
	response.Conferences.Offset = req.ConferenceOffset
	
	// Directly assign stats (embedded struct will serialize correctly)
	if r.stats != nil {
		response.Stats.ReviewerStats = r.stats
	} else {
		// Ensure non-nil stats
		response.Stats.ReviewerStats = &dto.ReviewerStats{}
	}
	
	response.Invitations.Data = invitations
	response.Invitations.Total = r.invitationsTotal
	response.Invitations.Limit = req.InvitationLimit
	response.Invitations.Offset = req.InvitationOffset
	
	response.RecentAssignments.Data = assignments
	response.RecentAssignments.Total = r.assignmentsTotal
	response.RecentAssignments.Limit = req.RecentAssignmentLimit
	response.RecentAssignments.Offset = req.RecentAssignmentOffset

	return response, nil
}

// GetConferencePapers godoc
// @Summary      Get papers assigned to reviewer in a conference with pagination
// @Description  Get all papers assigned to a reviewer in a specific conference with pagination, search and filter
// @Tags         reviewers
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        reviewer_id path int true "Reviewer User ID"
// @Param        conference_id path int true "Conference ID"
// @Param        limit query int false "Limit results (default: 20)"
// @Param        offset query int false "Offset for pagination"
// @Param        search query string false "Search by paper title"
// @Param        status query string false "Filter by assignment status"
// @Success      200 {object} dto.GetConferencePapersResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /reviewer/{reviewer_id}/conferences/{conference_id}/papers [get]
func (c *Controller) GetConferencePapers(ginCtx *gin.Context, req *dto.GetConferencePapersRequest) (*dto.GetConferencePapersResponse, error) {
	ctx := ginCtx.Request.Context()

	// Set default limit if not specified
	if req.Limit == 0 {
		req.Limit = 20
	}

	papers, total, err := c.reviewerStorage.GetAssignedPapers(ctx, req.ReviewerID, req.ConferenceID, &reviewerStorage.PaperListParams{
		Limit:  req.Limit,
		Offset: req.Offset,
		Search: req.Search,
		Status: req.Status,
	})
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	// Ensure non-nil array
	if papers == nil {
		papers = []*dto.AssignedPaperResponse{}
	}

	return &dto.GetConferencePapersResponse{
		Papers: papers,
		Total:  total,
		Limit:  req.Limit,
		Offset: req.Offset,
	}, nil
}

// GetCompletedPapers godoc
// @Summary      Get all completed papers for a reviewer across all conferences
// @Description  Get all papers with assignment_status="completed" for a reviewer with pagination and search
// @Tags         reviewers
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        reviewer_id path int true "Reviewer User ID"
// @Param        limit query int false "Limit results (default: 20)"
// @Param        offset query int false "Offset for pagination"
// @Param        search query string false "Search by paper title"
// @Success      200 {object} dto.GetCompletedPapersResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /reviewer/{reviewer_id}/completed-papers [get]
func (c *Controller) GetCompletedPapers(ginCtx *gin.Context, req *dto.GetCompletedPapersRequest) (*dto.GetCompletedPapersResponse, error) {
	ctx := ginCtx.Request.Context()

	// Set default limit if not specified
	if req.Limit == 0 {
		req.Limit = 20
	}

	papers, total, err := c.reviewerStorage.GetCompletedPapers(ctx, req.ReviewerID, &reviewerStorage.PaperListParams{
		Limit:  req.Limit,
		Offset: req.Offset,
		Search: req.Search,
	})
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	// Ensure non-nil array
	if papers == nil {
		papers = []*dto.AssignedPaperResponse{}
	}

	return &dto.GetCompletedPapersResponse{
		Papers: papers,
		Total:  total,
		Limit:  req.Limit,
		Offset: req.Offset,
	}, nil
}