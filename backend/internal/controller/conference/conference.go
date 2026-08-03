package conference

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/dcao/conferencespace/internal/assignment"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	notificationService "github.com/dcao/conferencespace/internal/service/notification"
	"github.com/dcao/conferencespace/internal/storage"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	conferencetemplate "github.com/dcao/conferencespace/internal/storage/conference_template"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
	reviewerStorage "github.com/dcao/conferencespace/internal/storage/reviewer"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	conferenceStorage   conferenceStorage.StorageInterface
	templateStorage     conferencetemplate.StorageInterface
	roleStorage         conferenceuserrole.StorageInterface
	reviewerStorage     reviewerStorage.StorageInterface
	userStorage         userStorage.StorageInterface
	assignmentService   *assignment.Service
	notificationService *notificationService.Service
}

func New(store *storage.Storage, assignmentSvc *assignment.Service) *Controller {
	return &Controller{
		conferenceStorage: store.Conference,
		templateStorage:   store.ConferenceTemplate,
		roleStorage:       store.ConferenceUserRole,
		reviewerStorage:   store.Reviewer,
		userStorage:       store.User,
		assignmentService: assignmentSvc,
	}
}

// NewWithNotifications creates a controller with notification support.
func NewWithNotifications(store *storage.Storage, assignmentSvc *assignment.Service, notifSvc *notificationService.Service) *Controller {
	return &Controller{
		conferenceStorage:   store.Conference,
		templateStorage:     store.ConferenceTemplate,
		roleStorage:         store.ConferenceUserRole,
		reviewerStorage:     store.Reviewer,
		userStorage:         store.User,
		assignmentService:   assignmentSvc,
		notificationService: notifSvc,
	}
}

func (c *Controller) enrichWithPCMembers(ctx context.Context, conf *dto.ConferenceResponse) {
	if conf == nil {
		return
	}
	emails, err := c.roleStorage.GetEmailsByRole(ctx, conf.ID, model.RolePC)
	if err != nil {
		conf.PCMembers = []string{}
		return
	}
	if emails == nil {
		emails = []string{}
	}
	conf.PCMembers = emails
}

// enrichWithReviewers populates the Reviewers field on a ConferenceResponse
func (c *Controller) enrichWithReviewers(ctx context.Context, conf *dto.ConferenceResponse) {
	if conf == nil {
		return
	}
	reviewers, _, err := c.reviewerStorage.List(ctx, conf.ID, &reviewerStorage.ListParams{Limit: 1000})
	if err != nil {
		conf.Reviewers = []string{}
		return
	}
	emails := make([]string, len(reviewers))
	for i, r := range reviewers {
		emails[i] = r.Email
	}
	conf.Reviewers = emails
}

func (c *Controller) inviteReviewers(ctx context.Context, conferenceID int64, emails []string, conferenceName string) {
	if len(emails) == 0 {
		return
	}

	var invites []dto.Reviewer
	for _, email := range emails {
		user, err := c.userStorage.GetByEmail(ctx, email)
		if err != nil {
			fmt.Printf("Warning: user %s not found, skipping reviewer invitation\n", email)
			continue
		}
		invites = append(invites, dto.Reviewer{
			UserID: user.ID,
			Status: model.ReviewerStatusPending,
		})
	}

	if len(invites) == 0 {
		return
	}

	result, err := c.reviewerStorage.BatchCreate(ctx, conferenceID, invites)
	if err != nil {
		fmt.Printf("Warning: failed to batch invite reviewers: %v\n", err)
		return
	}

	// Send notifications
	if c.notificationService != nil && len(result.Success) > 0 {
		go func() {
			bgCtx := context.Background()
			for _, reviewer := range result.Success {
				if err := c.notificationService.NotifyReviewerInvited(bgCtx, reviewer.Email, conferenceName, conferenceID); err != nil {
					fmt.Printf("Warning: failed to send invitation notification to %s: %v\n", reviewer.Email, err)
				}
			}
		}()
	}
}

// publicConferenceConfigurations keeps only non-sensitive fields that are
// safe for non-privileged users (e.g., authors) to view.
func publicConferenceConfigurations(config *dto.ConferenceConfiguration) *dto.ConferenceConfiguration {
	if config == nil {
		return nil
	}

	publicConfig := &dto.ConferenceConfiguration{
		StartDate:                   config.StartDate,
		EndDate:                     config.EndDate,
		AbstractSubmissionDeadline:  config.AbstractSubmissionDeadline,
		FullPaperSubmissionDeadline: config.FullPaperSubmissionDeadline,
		CameraReadyDeadline:         config.CameraReadyDeadline,
		CallForPaperText:            config.CallForPaperText,
		// Include date-related nested settings so authors can see timeline events
		DiscussionSettings: config.DiscussionSettings,
		RebuttalSettings:   config.RebuttalSettings,
	}

	if publicConfig.StartDate == nil &&
		publicConfig.EndDate == nil &&
		publicConfig.AbstractSubmissionDeadline == nil &&
		publicConfig.FullPaperSubmissionDeadline == nil &&
		publicConfig.CameraReadyDeadline == nil &&
		publicConfig.CallForPaperText == nil &&
		publicConfig.DiscussionSettings == nil &&
		publicConfig.RebuttalSettings == nil {
		return nil
	}

	return publicConfig
}

// closeSubmissionDeadlinesAt snaps open submission deadlines to closedAt when moving into review.
func closeSubmissionDeadlinesAt(config *dto.ConferenceConfiguration, closedAt time.Time) *dto.ConferenceConfiguration {
	if config == nil {
		return &dto.ConferenceConfiguration{
			FullPaperSubmissionDeadline: &closedAt,
		}
	}

	updated := *config
	if updated.FullPaperSubmissionDeadline == nil || closedAt.Before(*updated.FullPaperSubmissionDeadline) {
		updated.FullPaperSubmissionDeadline = &closedAt
	}
	if updated.AbstractSubmissionDeadline != nil && closedAt.Before(*updated.AbstractSubmissionDeadline) {
		updated.AbstractSubmissionDeadline = &closedAt
	}
	if updated.DiscussionSettings != nil {
		discussion := *updated.DiscussionSettings
		if discussion.StartAt == nil || closedAt.Before(*discussion.StartAt) {
			discussion.StartAt = &closedAt
		}
		updated.DiscussionSettings = &discussion
	}

	return &updated
}

// Create godoc
// @Summary      Create a new conference
// @Description  Create a new conference with optional tracks, co-chairs, and configurations (authenticated users only)
// @Tags         conferences
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request body dto.Conference true "Conference data (title, acronym, chair, optional: tracks[], co_chairs[], domain[], configurations)"
// @Success      201 {object} dto.ConferenceResponse
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

	req.Conference.Chair = userEmail

	conference, err := c.conferenceStorage.Create(ctx, req.Conference)
	if err != nil {
		return nil, err
	}

	// Add creator as chair and co-chairs in the roles table (bulk insert)
	roles := []model.RoleAssignment{
		{
			ConferenceID: conference.ID,
			UserEmail:    userEmail,
			Role:         model.RoleChair,
		},
	}

	// Add co-chairs if provided
	if len(req.Conference.CoChairs) > 0 {
		for _, coChairEmail := range req.Conference.CoChairs {
			if coChairEmail != "" && coChairEmail != userEmail {
				roles = append(roles, model.RoleAssignment{
					ConferenceID: conference.ID,
					UserEmail:    coChairEmail,
					Role:         model.RoleCoChair,
				})
			}
		}
	}

	// Add PC members if provided
	if len(req.Conference.PCMembers) > 0 {
		for _, pcEmail := range req.Conference.PCMembers {
			if pcEmail != "" && pcEmail != userEmail {
				roles = append(roles, model.RoleAssignment{
					ConferenceID: conference.ID,
					UserEmail:    pcEmail,
					Role:         model.RolePC,
				})
			}
		}
	}

	if err := c.roleStorage.AddRoles(ctx, roles); err != nil {
		return nil, handler.NewErrorResponse(http.StatusConflict, err.Error())
	}

	// Invite reviewers if provided
	if len(req.Conference.Reviewers) > 0 {
		c.inviteReviewers(ctx, conference.ID, req.Conference.Reviewers, conference.Title)
	}

	c.enrichWithPCMembers(ctx, conference)
	c.enrichWithReviewers(ctx, conference)
	return conference, nil
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
// @Param        myConferences query bool false "Filter to show only conferences where user has a role"
// @Param        role query string false "When used with myConferences=true, filter by specific role: 'chair', 'author', 'reviewer'"
// @Param        myBookmark query bool false "Filter to show only conferences that user has bookmarked"
// @Success      200 {object} dto.UserConferenceListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences [get]
func (c *Controller) List(ginCtx *gin.Context, req *dto.ConferenceListRequest) (*dto.UserConferenceListResponse, error) {
	ctx := ginCtx.Request.Context()

	// Get current user email for filtering
	userEmail, _ := utils.GetEmail(ginCtx)

	params := &conferenceStorage.QueryParams{
		Limit:         req.Limit,
		Offset:        req.Offset,
		Title:         req.Title,
		Acronym:       req.Acronym,
		Chair:         req.Chair,
		Status:        req.Status,
		MyConferences: req.MyConferences,
		Role:          req.Role,
		UserEmail:     userEmail,
		MyBookmark:    req.MyBookmark,
	}

	// For non-myConferences (explorer) requests: restrict to public statuses only
	// unless a specific status filter is already applied
	if !req.MyConferences && req.Status == "" {
		params.PublicOnly = true
	}

	conferences, total, err := c.conferenceStorage.List(ctx, params)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	// Convert to user-specific response with role information (already included from JOIN)
	userConferences := make([]*dto.UserConferenceResponse, len(conferences))
	for i, conf := range conferences {
		userConf := &dto.UserConferenceResponse{
			ConferenceResponse: *conf,
			UserRole:           conf.UserRole,
		}

		// Sanitize sensitive fields for non-chair callers.
		// Use the already-loaded Chair, CoChairs, and UserRole fields to
		// avoid an N+1 DB query per conference.
		isAdmin := conf.Chair == userEmail || conf.UserRole == model.RoleChair || conf.UserRole == model.RoleCoChair
		if !isAdmin {
			for _, cc := range conf.CoChairs {
				if cc == userEmail {
					isAdmin = true
					break
				}
			}
		}
		if !isAdmin {
			userConf.Configurations = publicConferenceConfigurations(userConf.Configurations)
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
// @Success      200 {object} dto.ConferenceResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id} [get]
func (c *Controller) Get(ginCtx *gin.Context, req *dto.ConferenceGetRequest) (*dto.ConferenceResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, _ := utils.GetEmail(ginCtx)

	conference, err := c.conferenceStorage.GetByIDForUser(ctx, req.ConferenceID, userEmail)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	c.enrichWithPCMembers(ctx, conference)
	c.enrichWithReviewers(ctx, conference)

	isPrivileged := utils.IsUserChairCoChairOrPC(ctx, c.roleStorage, req.ConferenceID, userEmail)

	// Non-privileged callers can only see public conferences (open, reviewing, completed)
	if !isPrivileged {
		if conference.Status == model.ConferenceStatusDraft || conference.Status == model.ConferenceStatusArchived {
			return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
		}
		// Sanitize sensitive fields
		conference.Configurations = publicConferenceConfigurations(conference.Configurations)
	}

	return conference, nil
}

// Update godoc
// @Summary      Update conference
// @Description  Update conference details including tracks, co-chairs, and configurations (only chair or co-chair can update)
// @Tags         conferences
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        request body dto.ConferenceUpdateRequest true "Updated conference data (can include tracks[], co_chairs[], domain[], configurations)"
// @Success      200 {object} dto.ConferenceResponse
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

	// Check if user has chair permissions
	if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, req.ConferenceID, userEmail) {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only the chair or co-chairs can update this conference")
	}

	// Sync PC member roles if PCMembers is provided in the update request
	if req.Conference.PCMembers != nil {
		currentPC, err := c.roleStorage.GetEmailsByRole(ctx, req.ConferenceID, model.RolePC)
		if err != nil {
			currentPC = []string{}
		}

		// Build sets for diff
		requestedSet := make(map[string]bool)
		for _, email := range req.Conference.PCMembers {
			if email != "" {
				requestedSet[email] = true
			}
		}
		currentSet := make(map[string]bool)
		for _, email := range currentPC {
			currentSet[email] = true
		}

		// Remove PC members no longer in the list
		for _, email := range currentPC {
			if !requestedSet[email] {
				_ = c.roleStorage.RemoveRole(ctx, req.ConferenceID, email)
			}
		}

		// Add new PC members
		for _, email := range req.Conference.PCMembers {
			if email != "" && !currentSet[email] {
				if err := c.roleStorage.AddRole(ctx, req.ConferenceID, email, model.RolePC); err != nil {
					return nil, handler.NewErrorResponse(http.StatusConflict, err.Error())
				}
			}
		}
	}

	// Sync Reviewer invitations if Reviewers is provided in the update request
	if req.Conference.Reviewers != nil {
		currentReviewers, _, err := c.reviewerStorage.List(ctx, req.ConferenceID, &reviewerStorage.ListParams{Limit: 1000})
		if err != nil {
			currentReviewers = []*dto.Reviewer{}
		}

		currentSet := make(map[string]int64)
		for _, r := range currentReviewers {
			currentSet[r.Email] = r.ID
		}

		requestedSet := make(map[string]bool)
		for _, email := range req.Conference.Reviewers {
			if email != "" {
				requestedSet[email] = true
			}
		}

		// Remove reviewers no longer in the list
		for email, id := range currentSet {
			if !requestedSet[email] {
				_ = c.reviewerStorage.Delete(ctx, id)
			}
		}

		// Add new reviewers
		var newEmails []string
		for _, email := range req.Conference.Reviewers {
			if email != "" {
				if _, exists := currentSet[email]; !exists {
					newEmails = append(newEmails, email)
				}
			}
		}
		if len(newEmails) > 0 {
			c.inviteReviewers(ctx, req.ConferenceID, newEmails, existing.Title)
		}
	}

	mergeConferenceForUpdate(existing, req.Conference)

	result, err := c.conferenceStorage.Update(ctx, req.ConferenceID, req.Conference)
	if err != nil {
		return nil, err
	}
	c.enrichWithPCMembers(ctx, result)
	c.enrichWithReviewers(ctx, result)
	return result, nil
}

// mergeConferenceForUpdate fills omitted/zero fields from the existing conference so
// partial PUT bodies (e.g. only pc_members or co_chairs) do not wipe metadata.
func mergeConferenceForUpdate(existing *dto.ConferenceResponse, update *dto.Conference) {
	if update.Title == "" {
		update.Title = existing.Title
	}
	if update.Acronym == "" {
		update.Acronym = existing.Acronym
	}
	if update.Description == "" {
		update.Description = existing.Description
	}
	if update.Chair == "" {
		update.Chair = existing.Chair
	}
	if update.Venue == "" {
		update.Venue = existing.Venue
	}
	if update.CoChairs == nil {
		update.CoChairs = existing.CoChairs
	}
	if update.Domain == nil {
		update.Domain = existing.Domain
	}
	if update.Tracks == nil {
		update.Tracks = existing.Tracks
	}
	if update.Configurations == nil {
		update.Configurations = existing.Configurations
	}
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

	// Check if user has chair permissions
	if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, req.ConferenceID, userEmail) {
		return handler.NewErrorResponse(http.StatusForbidden, "only the chair or co-chairs can delete this conference")
	}

	return c.conferenceStorage.Delete(ctx, req.ConferenceID)
}

func (c *Controller) ListTemplates(ginCtx *gin.Context, req *dto.ConferenceConfigTemplateListRequest) (*dto.ConferenceConfigTemplateListResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	templates, err := c.templateStorage.List(ctx, userEmail, req.Search)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &dto.ConferenceConfigTemplateListResponse{Templates: templates}, nil
}

func (c *Controller) CreateTemplate(ginCtx *gin.Context, req *dto.ConferenceConfigTemplateCreateRequest) (*dto.ConferenceConfigTemplateResponse, error) {
	ctx := ginCtx.Request.Context()

	if req.Template == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "template data is required")
	}
	if strings.TrimSpace(req.Template.Name) == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "template name is required")
	}
	if req.Template.Payload == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "template payload is required")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	req.Template.Name = strings.TrimSpace(req.Template.Name)
	response, err := c.templateStorage.Create(ctx, userEmail, req.Template)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}
	return response, nil
}

func (c *Controller) UpdateTemplate(ginCtx *gin.Context, req *dto.ConferenceConfigTemplateUpdateRequest) (*dto.ConferenceConfigTemplateResponse, error) {
	ctx := ginCtx.Request.Context()

	if req.Template == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "template data is required")
	}
	if strings.TrimSpace(req.Template.Name) == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "template name is required")
	}
	if req.Template.Payload == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "template payload is required")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	req.Template.Name = strings.TrimSpace(req.Template.Name)
	response, err := c.templateStorage.Update(ctx, req.TemplateID, userEmail, req.Template)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, handler.NewErrorResponse(http.StatusNotFound, "conference config template not found")
		}
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}
	return response, nil
}

func (c *Controller) DeleteTemplate(ginCtx *gin.Context, req *dto.ConferenceConfigTemplateDeleteRequest) error {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	if err := c.templateStorage.Delete(ctx, req.TemplateID, userEmail); err != nil {
		if strings.Contains(err.Error(), "not found") {
			return handler.NewErrorResponse(http.StatusNotFound, "conference config template not found")
		}
		return handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return nil
}

// ToggleBookmark godoc
// @Summary      Toggle conference bookmark
// @Description  Add or remove a conference bookmark for the authenticated user
// @Tags         conferences
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.ConferenceBookmarkResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/bookmark [put]
func (c *Controller) ToggleBookmark(ginCtx *gin.Context, req *dto.ConferenceBookmarkRequest) (*dto.ConferenceBookmarkResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	// Check if conference exists
	_, err := c.conferenceStorage.GetByID(ctx, req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	// Check if already bookmarked
	isBookmarked, err := c.conferenceStorage.IsBookmarked(ctx, userEmail, req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	if isBookmarked {
		// Remove bookmark
		err = c.conferenceStorage.RemoveBookmark(ctx, userEmail, req.ConferenceID)
		if err != nil {
			return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
		}
		return &dto.ConferenceBookmarkResponse{
			Message:      "bookmark removed successfully",
			IsBookmarked: false,
		}, nil
	} else {
		// Add bookmark
		err = c.conferenceStorage.AddBookmark(ctx, userEmail, req.ConferenceID)
		if err != nil {
			return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
		}
		return &dto.ConferenceBookmarkResponse{
			Message:      "bookmark added successfully",
			IsBookmarked: true,
		}, nil
	}
}

// TransitionStatus godoc
// @Summary      Transition conference status
// @Description  Transition conference status (open -> reviewing -> completed). Auto-assigns reviewers when transitioning to reviewing.
// @Tags         conferences
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        request body dto.ConferenceTransitionStatusRequest true "New status (open, reviewing, completed)"
// @Success      200 {object} dto.ConferenceTransitionStatusResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/status [put]
func (c *Controller) TransitionStatus(ginCtx *gin.Context, req *dto.ConferenceTransitionStatusRequest) (*dto.ConferenceTransitionStatusResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	// Get current conference to check permissions and current status
	conference, err := c.conferenceStorage.GetByID(ctx, req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	// Check if user is chair or co-chair
	isChair := conference.Chair == userEmail
	isCoChair := false
	for _, coChair := range conference.CoChairs {
		if coChair == userEmail {
			isCoChair = true
			break
		}
	}

	if !isChair && !isCoChair {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only chair or co-chairs can change conference status")
	}

	previousStatus := conference.Status

	// Validate status transition (no reversion to earlier pipeline stages)
	validTransitions := map[string][]string{
		// Draft -> Open (initial publish) or Archived
		model.ConferenceStatusDraft: {model.ConferenceStatusOpen, model.ConferenceStatusArchived},
		// Open -> Reviewing or Archived
		model.ConferenceStatusOpen: {model.ConferenceStatusReviewing, model.ConferenceStatusArchived},
		// Reviewing -> Completed or Archived
		model.ConferenceStatusReviewing: {model.ConferenceStatusCompleted, model.ConferenceStatusArchived},
		// Completed -> Archived
		model.ConferenceStatusCompleted: {model.ConferenceStatusArchived},
		// Archived -> Completed (allow unarchive)
		model.ConferenceStatusArchived: {model.ConferenceStatusCompleted},
	}

	allowedStatuses, exists := validTransitions[previousStatus]
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid current status")
	}

	isValid := false
	for _, allowed := range allowedStatuses {
		if allowed == req.NewStatus {
			isValid = true
			break
		}
	}

	if !isValid {
		return nil, handler.NewErrorResponse(http.StatusBadRequest,
			fmt.Sprintf("cannot transition from %s to %s. Allowed transitions: %v",
				previousStatus, req.NewStatus, allowedStatuses))
	}

	var configurationsUpdate *dto.ConferenceConfiguration
	if req.NewStatus == model.ConferenceStatusReviewing {
		configurationsUpdate = closeSubmissionDeadlinesAt(conference.Configurations, time.Now())
	}

	// Perform status transition
	_, err = c.conferenceStorage.TransitionStatus(ctx, req.ConferenceID, req.NewStatus, configurationsUpdate)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	response := &dto.ConferenceTransitionStatusResponse{
		Message:        "conference status updated successfully",
		PreviousStatus: previousStatus,
		NewStatus:      req.NewStatus,
	}

	// If transitioning to reviewing, trigger auto-assign automatically
	if req.NewStatus == model.ConferenceStatusReviewing && c.assignmentService != nil {
		autoAssignConfig := assignment.AutoAssignConfig{
			MinReviewersPerPaper: 2, // Default values, can be made configurable
			MaxReviewersPerPaper: 3,
			MinScoreThreshold:    0.3,
			DryRun:               false,
		}
		_, err := c.assignmentService.AutoAssign(ctx, req.ConferenceID, autoAssignConfig)
		if err != nil {
			// Log error but don't fail the status transition
			response.Message = fmt.Sprintf("conference status updated to reviewing. Auto-assignment failed: %v", err)
		} else {
			response.Message = "conference status updated to reviewing and reviewers auto-assigned successfully"
		}
	}

	return response, nil
}

// GetStats godoc
// @Summary      Get conference statistics
// @Description  Returns aggregated submission, review, and track statistics for a conference (chair only)
// @Tags         conferences
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.ConferenceStatsResponse
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/stats [get]
func (c *Controller) GetStats(ginCtx *gin.Context, req *dto.ConferenceStatsRequest) (*dto.ConferenceStatsResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, req.ConferenceID, userEmail) {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only chair or co-chair can view conference stats")
	}

	stats, err := c.conferenceStorage.GetStats(ctx, req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return stats, nil
}
