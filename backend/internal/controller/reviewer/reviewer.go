package reviewer

import (
	"context"
	"fmt"
	"net/http"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	coiService "github.com/dcao/conferencespace/internal/service/coi"
	notificationService "github.com/dcao/conferencespace/internal/service/notification"
	"github.com/dcao/conferencespace/internal/storage"
	assignmentStorage "github.com/dcao/conferencespace/internal/storage/assignment"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
	rebuttalStorage "github.com/dcao/conferencespace/internal/storage/rebuttal"
	reviewerStorage "github.com/dcao/conferencespace/internal/storage/reviewer"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	reviewerStorage     reviewerStorage.StorageInterface
	assignmentStorage   assignmentStorage.StorageInterface
	rebuttalStorage     rebuttalStorage.StorageInterface
	roleStorage         conferenceuserrole.StorageInterface
	userStorage         userStorage.StorageInterface
	conferenceStorage   conferenceStorage.StorageInterface
	submissionStorage   submissionStorage.StorageInterface
	coiService          *coiService.Service
	notificationService *notificationService.Service
}

func New(store *storage.Storage, coiSvc *coiService.Service) *Controller {
	return &Controller{
		reviewerStorage:   store.Reviewer,
		assignmentStorage: store.Assignment,
		rebuttalStorage:   store.RebuttalPoint,
		roleStorage:       store.ConferenceUserRole,
		userStorage:       store.User,
		conferenceStorage: store.Conference,
		submissionStorage: store.Submission,
		coiService:        coiSvc,
	}
}

// NewWithNotifications creates a controller with notification support
func NewWithNotifications(store *storage.Storage, coiSvc *coiService.Service, notifService *notificationService.Service) *Controller {
	return &Controller{
		reviewerStorage:     store.Reviewer,
		assignmentStorage:   store.Assignment,
		rebuttalStorage:     store.RebuttalPoint,
		roleStorage:         store.ConferenceUserRole,
		userStorage:         store.User,
		conferenceStorage:   store.Conference,
		submissionStorage:   store.Submission,
		coiService:          coiSvc,
		notificationService: notifService,
	}
}

func (c *Controller) markReviewerDirty(ctx context.Context, conferenceID, reviewerID int64, reason string) {
	if c.coiService == nil {
		return
	}

	if err := c.coiService.MarkReviewerDirty(ctx, conferenceID, reviewerID, reason); err != nil {
		fmt.Printf("Warning: failed to mark reviewer %d dirty for COI refresh: %v\n", reviewerID, err)
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

	// Send notifications to successfully invited reviewers
	if c.notificationService != nil && len(result.Success) > 0 {
		// Get conference name for notification
		conference, err := c.conferenceStorage.GetByID(ctx, req.ConferenceID)
		if err == nil && conference != nil {
			conferenceName := conference.Title
			conferenceID := req.ConferenceID

			// Send notifications asynchronously
			go func() {
				bgCtx := context.Background()
				for _, reviewer := range result.Success {
					if err := c.notificationService.NotifyReviewerInvited(bgCtx, reviewer.Email, conferenceName, conferenceID); err != nil {
						fmt.Printf("Warning: Failed to send invitation notification to %s: %v\n", reviewer.Email, err)
					}
				}
			}()
		}
	}

	for _, reviewer := range result.Success {
		if reviewer.Status == model.ReviewerStatusAccepted {
			c.markReviewerDirty(ctx, req.ConferenceID, reviewer.ID, "reviewer_invited")
		}
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

	// If reviewer accepted the invitation, add them to conference_user_roles table
	if req.Status == model.ReviewerStatusAccepted {
		roleAssignment := model.RoleAssignment{
			ConferenceID: req.ConferenceID,
			UserEmail:    result.Email,
			Role:         model.RoleReviewer,
		}
		err = c.roleStorage.AddRole(ctx, roleAssignment.ConferenceID, roleAssignment.UserEmail, roleAssignment.Role)
		if err != nil {
			// Log error but don't fail the status update
			// (role might already exist or have other non-critical issues)
			fmt.Printf("Warning: Failed to add reviewer role for %s in conference %d: %v\n", result.Email, req.ConferenceID, err)
		}
	}

	// Send notification to chair about reviewer's response
	if c.notificationService != nil && (req.Status == model.ReviewerStatusAccepted || req.Status == model.ReviewerStatusRejected) {
		conference, err := c.conferenceStorage.GetByID(ctx, req.ConferenceID)
		if err == nil && conference != nil {
			// Get reviewer's name from user storage
			reviewerUser, err := c.userStorage.GetByEmail(ctx, result.Email)
			reviewerName := result.Email // Default to email if we can't get the name
			if err == nil && reviewerUser != nil {
				reviewerName = reviewerUser.FirstName + " " + reviewerUser.LastName
			}

			conferenceID := req.ConferenceID
			conferenceName := conference.Title
			chairEmail := conference.Chair
			reviewerEmail := result.Email

			// Send notification asynchronously
			go func() {
				bgCtx := context.Background()
				if req.Status == model.ReviewerStatusAccepted {
					if err := c.notificationService.NotifyReviewerAccepted(bgCtx, chairEmail, reviewerName, reviewerEmail, conferenceName, conferenceID); err != nil {
						fmt.Printf("Warning: Failed to send reviewer accepted notification: %v\n", err)
					}
				} else if req.Status == model.ReviewerStatusRejected {
					if err := c.notificationService.NotifyReviewerRejected(bgCtx, chairEmail, reviewerName, reviewerEmail, conferenceName, conferenceID); err != nil {
						fmt.Printf("Warning: Failed to send reviewer rejected notification: %v\n", err)
					}
				}
			}()
		}
	}

	c.markReviewerDirty(ctx, req.ConferenceID, req.ReviewerID, "reviewer_status_updated")

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

	c.markReviewerDirty(ctx, req.ConferenceID, req.ReviewerID, "reviewer_deleted")

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

	// Get reviewer by email
	reviewer, err := c.userStorage.GetByEmail(ctx, req.ReviewerEmail)
	if err != nil {
		return nil, fmt.Errorf("failed to get reviewer: %w", err)
	}

	reviewerID := reviewer.ID

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
		r.conferences, r.conferencesTotal, r.err = c.reviewerStorage.GetConferencesByReviewer(ctx, reviewerID, &reviewerStorage.ConferenceListParams{
			Limit:  req.ConferenceLimit,
			Offset: req.ConferenceOffset,
			Search: req.ConferenceSearch,
		})
		if r.err != nil {
			resultChan <- r
			return
		}

		// Get stats
		r.stats, r.err = c.reviewerStorage.GetReviewerStats(ctx, reviewerID)
		if r.err != nil {
			resultChan <- r
			return
		}

		// Get invitations with pagination and status filter
		r.invitations, r.invitationsTotal, r.err = c.reviewerStorage.GetPendingInvitations(ctx, reviewerID, &reviewerStorage.InvitationListParams{
			Limit:  req.InvitationLimit,
			Offset: req.InvitationOffset,
			Status: req.InvitationStatus,
		})
		if r.err != nil {
			resultChan <- r
			return
		}

		// Get recent assignments with pagination
		r.assignments, r.assignmentsTotal, r.err = c.reviewerStorage.GetRecentAssignments(ctx, reviewerID, req.RecentAssignmentLimit, req.RecentAssignmentOffset)
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

	// Get reviewer by email
	reviewer, err := c.userStorage.GetByEmail(ctx, req.ReviewerEmail)
	if err != nil {
		return nil, fmt.Errorf("failed to get reviewer: %w", err)
	}

	reviewerID := reviewer.ID

	// Set default limit if not specified
	if req.Limit == 0 {
		req.Limit = 20
	}

	papers, total, err := c.reviewerStorage.GetAssignedPapers(ctx, reviewerID, req.ConferenceID, &reviewerStorage.PaperListParams{
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

	// Get reviewer by email
	reviewer, err := c.userStorage.GetByEmail(ctx, req.ReviewerEmail)
	if err != nil {
		return nil, fmt.Errorf("failed to get reviewer: %w", err)
	}

	reviewerID := reviewer.ID

	// Set default limit if not specified
	if req.Limit == 0 {
		req.Limit = 20
	}

	papers, total, err := c.reviewerStorage.GetCompletedPapers(ctx, reviewerID, &reviewerStorage.PaperListParams{
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

// AcknowledgeRebuttal godoc
// @Summary      Reviewer acknowledges author rebuttal
// @Description  Reviewer marks that they have read the author's rebuttal for their assignment (idempotent)
// @Tags         assignments
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        assignment_id path int true "Assignment ID"
// @Success      200 {object} dto.RebuttalStatusResponse
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/assignments/{assignment_id}/rebuttal/acknowledge [put]
func (c *Controller) AcknowledgeRebuttal(ginCtx *gin.Context, req *dto.AcknowledgeRebuttalRequest) (*dto.RebuttalStatusResponse, error) {
	ctx := ginCtx.Request.Context()

	_, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	// Phase guard: conference rebuttal must be open (awaiting or submitted)
	confRebuttal, err := c.conferenceStorage.GetRebuttalSettings(ctx, req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to check rebuttal phase")
	}
	if confRebuttal.Phase == model.ConferenceRebuttalPhaseNotStarted || confRebuttal.Phase == model.ConferenceRebuttalPhaseFinalized {
		return nil, handler.NewErrorResponse(http.StatusBadRequest,
			fmt.Sprintf("rebuttal acknowledgment not allowed in phase: %s", confRebuttal.Phase))
	}

	assignment, err := c.assignmentStorage.AcknowledgeRebuttal(ctx, req.AssignmentID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	// Notify author that their rebuttal was acknowledged (fire-and-forget)
	if c.notificationService != nil {
		go func() {
			bgCtx := context.Background()
			conf, _ := c.conferenceStorage.GetByID(bgCtx, req.ConferenceID)
			if conf != nil {
				sub, _ := c.submissionStorage.GetByID(bgCtx, assignment.SubmissionID)
				if sub != nil {
					if err := c.notificationService.NotifyRebuttalAcknowledged(bgCtx, sub.Author, sub.Title, conf.Title, req.ConferenceID, assignment.SubmissionID); err != nil {
						fmt.Printf("Warning: failed to notify author %s: %v\n", sub.Author, err)
					}
				}
			}
		}()
	}

	return &dto.RebuttalStatusResponse{
		RebuttalPhase:          model.RebuttalPhaseSubmitted,
		RebuttalStatus:         assignment.RebuttalStatus,
		RebuttalAcknowledgedAt: assignment.RebuttalAcknowledgedAt,
	}, nil
}

// AcknowledgePoint godoc
// @Summary      Acknowledge a specific rebuttal point
// @Description  Reviewer marks one review point as addressed/not-addressed with optional note (idempotent)
// @Tags         assignments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        assignment_id path int true "Assignment ID"
// @Param        point_id path string true "Point ID"
// @Param        request body dto.AcknowledgePointRequest true "Status and note"
// @Success      200 {object} handler.Response
// @Router       /conferences/{conference_id}/assignments/{assignment_id}/rebuttal/points/{point_id}/acknowledge [put]
func (c *Controller) AcknowledgePoint(ginCtx *gin.Context, req *dto.AcknowledgePointRequest) (*map[string]string, error) {
	ctx := ginCtx.Request.Context()

	_, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	// Resolve submissionID from assignment
	assignment, err := c.assignmentStorage.GetByID(ctx, req.AssignmentID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "assignment not found")
	}

	if err := c.rebuttalStorage.AcknowledgePoint(ctx, assignment.SubmissionID, req.PointID, req.Status, req.Note); err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	result := map[string]string{"status": "acknowledged"}
	return &result, nil
}
