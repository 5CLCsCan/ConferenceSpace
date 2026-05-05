package user

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/dcao/conferencespace/internal/assignment"
	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
	"github.com/dcao/conferencespace/internal/controller/semantic_scholar"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	reviewerSuggestionService "github.com/dcao/conferencespace/internal/service/reviewer_suggestion"
	"github.com/dcao/conferencespace/internal/storage"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
	"github.com/dcao/conferencespace/internal/storage/scholar"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	userStorage               userStorage.StorageInterface
	submissionStorage         submissionStorage.StorageInterface
	conferenceStorage         conferenceStorage.StorageInterface
	roleStorage               conferenceuserrole.StorageInterface
	assignmentService         *assignment.Service
	scholarStorage            scholar.StorageInterface
	semanticScholarCtrl       *semantic_scholar.Controller
	reviewerSuggestionService *reviewerSuggestionService.Service
}

func New(
	store *storage.Storage,
	assignmentService *assignment.Service,
	semanticScholarCtrl *semantic_scholar.Controller,
	reviewerSuggestionSvc *reviewerSuggestionService.Service,
) *Controller {
	return &Controller{
		userStorage:               store.User,
		submissionStorage:         store.Submission,
		conferenceStorage:         store.Conference,
		roleStorage:               store.ConferenceUserRole,
		scholarStorage:            store.Scholar,
		assignmentService:         assignmentService,
		semanticScholarCtrl:       semanticScholarCtrl,
		reviewerSuggestionService: reviewerSuggestionSvc,
	}
}

// List godoc
// @Summary      List users
// @Description  Get list of users with pagination and filters
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        limit query int false "Limit results"
// @Param        offset query int false "Offset for pagination"
// @Param        email query string false "Filter by email"
// @Param        first_name query string false "Filter by first name"
// @Param        last_name query string false "Filter by last name"
// @Success      200 {object} dto.UserListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /users [get]
func (c *Controller) List(ginCtx *gin.Context, req *dto.UserListRequest) (*dto.UserListResponse, error) {
	ctx := ginCtx.Request.Context()

	params := &userStorage.QueryParams{
		Limit:     req.Limit,
		Offset:    req.Offset,
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
	}

	users, total, err := c.userStorage.List(ctx, params)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	userEmail, _ := utils.GetEmail(ginCtx)

	// Sanitize non-self user records
	for _, u := range users {
		if u.Email != userEmail {
			sanitizeUserResponse(u)
		}
	}

	return &dto.UserListResponse{
		Users: users,
		Total: total,
	}, nil
}

// Get godoc
// @Summary      Get user by email
// @Description  Get a specific user by their email
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        email path string true "User Email"
// @Success      200 {object} dto.UserResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /users/{email} [get]
func (c *Controller) Get(ginCtx *gin.Context) (*dto.UserResponse, error) {
	ctx := ginCtx.Request.Context()

	email := ginCtx.Param("email")
	if email == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "email is required")
	}

	user, err := c.userStorage.GetByEmail(ctx, email)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}

	userEmail, _ := utils.GetEmail(ginCtx)
	if email != userEmail {
		sanitizeUserResponse(user)
	}

	return user, nil
}

// GetMe godoc
// @Summary      Get current user
// @Description  Get authenticated user's profile
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} dto.UserResponse
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /users/me [get]
func (c *Controller) GetMe(ginCtx *gin.Context) (*dto.UserResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	user, err := c.userStorage.GetByEmail(ctx, userEmail)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}

	// Populate user's distinct active roles across all conferences
	roles, err := c.roleStorage.GetAllUserRoles(ctx, userEmail)
	if err == nil {
		user.Roles = roles
	}

	// Author is always available as a base role (any user can submit papers)
	hasAuthor := false
	for _, r := range user.Roles {
		if r == "author" {
			hasAuthor = true
			break
		}
	}
	if !hasAuthor {
		user.Roles = append([]string{"author"}, user.Roles...)
	}

	return user, nil
}

// GetProfileSyncStatus godoc
// @Summary      Get profile sync status
// @Description  Get current user's academic profile sync lifecycle state
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} dto.ProfileSyncStatusResponse
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /users/me/profile-sync-status [get]
func (c *Controller) GetProfileSyncStatus(ginCtx *gin.Context) (*dto.ProfileSyncStatusResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	user, err := c.userStorage.GetByEmail(ctx, userEmail)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}

	return &dto.ProfileSyncStatusResponse{
		SemanticScholarID: user.SemanticScholarID,
		ProfileSyncStatus: user.ProfileSyncStatus,
	}, nil
}

func (c *Controller) getAcademicProfileByUserID(ctx context.Context, userID int64) (*dto.AcademicProfileResponse, error) {
	if c.scholarStorage == nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "academic profile storage not initialized")
	}

	profile, err := c.scholarStorage.GetProfileByUserID(ctx, userID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to get academic profile")
	}
	if profile == nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "academic profile not linked")
	}

	papers, err := c.scholarStorage.GetPapersByProfileID(ctx, profile.ID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to get academic papers")
	}

	respPapers := make([]dto.AcademicPaper, len(papers))
	for i, p := range papers {
		var authors []dto.PaperAuthor
		if p.Authors != nil {
			_ = json.Unmarshal(p.Authors, &authors)
		}

		respPapers[i] = dto.AcademicPaper{
			PaperID:       p.SemanticScholarID,
			Title:         p.Title,
			Abstract:      p.Abstract,
			Venue:         p.Venue,
			Year:          p.Year,
			CitationCount: p.CitationCount,
			URL:           p.URL,
			Authors:       authors,
		}
	}

	return &dto.AcademicProfileResponse{
		UserID:            profile.UserID,
		SemanticScholarID: profile.SemanticScholarID,
		Name:              profile.Name,
		Affiliations:      profile.Affiliations,
		PaperCount:        profile.PaperCount,
		CitationCount:     profile.CitationCount,
		HIndex:            profile.HIndex,
		URL:               profile.URL,
		SyncedAt:          profile.UpdatedAt.Format("2006-01-02 15:04:05"),
		Papers:            respPapers,
	}, nil
}

// Update godoc
// @Summary      Update user
// @Description  Update user profile (only own profile)
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        email path string true "User Email"
// @Param        request body dto.UserUpdateRequest true "Updated user data"
// @Success      200 {object} dto.UserResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /users/{email} [put]
func (c *Controller) Update(ginCtx *gin.Context, req *dto.UserUpdateRequest) (*dto.UserResponse, error) {
	ctx := ginCtx.Request.Context()

	email := ginCtx.Param("email")
	if email == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "email is required")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists || userEmail != email {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "you can only update your own profile")
	}

	if req.User == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "user data is required")
	}

	updated, err := c.userStorage.UpdateByEmail(ctx, email, req.User)
	if err != nil {
		if err == userStorage.ErrUserNotFound {
			return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
		}
		if err == userStorage.ErrEmailAlreadyExists {
			return nil, handler.NewErrorResponse(http.StatusConflict, "email already exists")
		}
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return updated, nil
}

// Search godoc
// @Summary      Search users
// @Description  Search users by email (for autocomplete/lookup). When the
// @Description  optional ?conference_id= is supplied, each returned user is
// @Description  annotated with `matched_fields` and `score` against that
// @Description  conference's topic set (same scoring as /reviewer-suggestions).
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        q query string true "Search query (email)"
// @Param        limit query int false "Limit results (default: 10)"
// @Param        conference_id query int false "If set, annotate each user with match evidence against this conference"
// @Success      200 {object} dto.UserSearchResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Router       /users/search [get]
func (c *Controller) Search(ginCtx *gin.Context) (*dto.UserSearchResponse, error) {
	ctx := ginCtx.Request.Context()

	query := ginCtx.Query("q")
	if query == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "search query is required")
	}

	limit := 10
	if limitStr := ginCtx.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 50 {
			limit = l
		}
	}

	// Use List with email filter
	params := &userStorage.QueryParams{
		Email:  query,
		Limit:  limit,
		Offset: 0,
	}

	users, total, err := c.userStorage.List(ctx, params)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	userEmail, _ := utils.GetEmail(ginCtx)

	// Sanitize non-self user records
	for _, u := range users {
		if u.Email != userEmail {
			sanitizeUserResponse(u)
		}
	}

	// Optional: annotate with conference-match evidence when ?conference_id= is supplied.
	// Field names mirror dto.ReviewerSuggestion (matched_fields, score) and stay omitted
	// from the response when this branch is skipped, preserving backwards compatibility.
	if confIDStr := ginCtx.Query("conference_id"); confIDStr != "" && c.reviewerSuggestionService != nil {
		if confID, err := strconv.ParseInt(confIDStr, 10, 64); err == nil && confID > 0 {
			if annotateErr := c.reviewerSuggestionService.AnnotateUsersWithMatch(ctx, confID, users); annotateErr != nil {
				// Graceful degrade: search still returns un-annotated rows.
				// We log via the gin context so it shows up alongside the request.
				_ = ginCtx.Error(fmt.Errorf("annotate users with match (conf=%d): %w", confID, annotateErr))
			}
		}
	}

	return &dto.UserSearchResponse{
		Users: users,
		Total: total,
	}, nil
}

// Delete godoc
// @Summary      Delete user
// @Description  Delete user account (only own account)
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        email path string true "User Email"
// @Success      200 {object} map[string]string
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Router       /users/{email} [delete]
func (c *Controller) Delete(ginCtx *gin.Context) error {
	ctx := ginCtx.Request.Context()

	email := ginCtx.Param("email")
	if email == "" {
		return handler.NewErrorResponse(http.StatusBadRequest, "email is required")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists || userEmail != email {
		return handler.NewErrorResponse(http.StatusForbidden, "you can only delete your own account")
	}

	return c.userStorage.DeleteByEmail(ctx, email)
}

// CheckCOI godoc
// @Summary      Check COI for a user against conference authors
// @Description  Check if a potential reviewer has conflicts of interest with authors in a conference
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        email path string true "User Email (potential reviewer)"
// @Param        conference_id query int true "Conference ID"
// @Success      200 {object} dto.UserCOICheckResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /users/{email}/coi-check [get]
func (c *Controller) CheckCOI(ginCtx *gin.Context, req *dto.UserCOICheckRequest) (*dto.UserCOICheckResponse, error) {
	ctx := ginCtx.Request.Context()

	// Validate conference_id is provided
	if req.ConferenceID == 0 {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "conference_id is required")
	}

	// Validate user_email is provided
	if req.UserEmail == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "user_email is required")
	}

	// Get the user being checked
	user, err := c.userStorage.GetByEmail(ctx, req.UserEmail)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}

	// Get conference configuration for COI settings
	conference, err := c.conferenceStorage.GetByID(ctx, req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	// Get all submissions (draft or submitted) in the conference
	submissions, _, err := c.submissionStorage.List(ctx, &submissionStorage.QueryParams{
		ConferenceID: req.ConferenceID,
		Limit:        10000, // Get all submissions (reasonable upper limit)
	})
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to fetch submissions")
	}

	// Extract unique authors from submissions
	authorMap := make(map[string]*dto.UserResponse) // email -> user
	for _, submission := range submissions {
		author, err := c.userStorage.GetByEmail(ctx, submission.Author)
		if err == nil {
			authorMap[submission.Author] = author
		}

		// Also check co-authors
		if submission.Information != nil && submission.Information.CoAuthors != nil {
			for _, coAuthorEmail := range submission.Information.CoAuthors {
				if coAuthorEmail != "" {
					coAuthor, err := c.userStorage.GetByEmail(ctx, coAuthorEmail)
					if err == nil {
						authorMap[coAuthorEmail] = coAuthor
					}
				}
			}
		}
	}

	// Check COI against each unique author
	conflictingAuthors := []dto.ConflictingAuthor{}

	// Use the relationship detector if available
	if c.assignmentService != nil {
		conflictingAuthors, err = c.checkCOIWithRelationshipDetector(ctx, user.Email, authorMap, conference)
		if err != nil {
			return nil, handler.NewErrorResponse(http.StatusInternalServerError, fmt.Sprintf("failed to check COI: %v", err))
		}
	}

	// Build response
	return &dto.UserCOICheckResponse{
		UserID:             user.ID,
		UserEmail:          user.Email,
		ConferenceID:       req.ConferenceID,
		TotalAuthors:       len(authorMap),
		ConflictingCount:   len(conflictingAuthors),
		ConflictingAuthors: conflictingAuthors,
	}, nil
}

// GetAcademicProfile godoc
// @Summary      Get current user's academic profile
// @Description  Get synced academic profile details and papers for the current user
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} dto.AcademicProfileResponse
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /users/me/academic-profile [get]
func (c *Controller) GetAcademicProfile(ginCtx *gin.Context) (*dto.AcademicProfileResponse, error) {
	ctx := ginCtx.Request.Context()

	// Auth check
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	user, err := c.userStorage.GetByEmail(ctx, userEmail)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}

	return c.getAcademicProfileByUserID(ctx, user.ID)
}

// GetAcademicProfileByEmail godoc
// @Summary      Get academic profile by user email
// @Description  Get synced academic profile details and papers for a specific authenticated user profile
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        email path string true "User Email"
// @Success      200 {object} dto.AcademicProfileResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /users/{email}/academic-profile [get]
func (c *Controller) GetAcademicProfileByEmail(ginCtx *gin.Context) (*dto.AcademicProfileResponse, error) {
	ctx := ginCtx.Request.Context()

	_, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	email := ginCtx.Param("email")
	if email == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "email is required")
	}

	user, err := c.userStorage.GetByEmail(ctx, email)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}

	return c.getAcademicProfileByUserID(ctx, user.ID)
}

// sanitizeUserResponse strips internal fields from user responses for non-self lookups
func sanitizeUserResponse(u *dto.UserResponse) {
	if u.User != nil {
		u.User.SemanticScholarID = nil
		u.User.ProfileSyncStatus = nil
	}
}

// checkCOIWithRelationshipDetector checks COI using the graph-based relationship detector
func (c *Controller) checkCOIWithRelationshipDetector(
	ctx context.Context,
	reviewerEmail string,
	authorMap map[string]*dto.UserResponse,
	conference *dto.ConferenceResponse,
) ([]dto.ConflictingAuthor, error) {
	conflicting := []dto.ConflictingAuthor{}

	// Get the relationship detector from the assignment service
	relationshipDetector := c.assignmentService.GetRelationshipDetector()
	if relationshipDetector == nil {
		// No relationship detector available, return empty list
		return conflicting, nil
	}

	// Configure detector with conference settings
	windowYears := detectors.DefaultCOIWindowYears
	if conference.Configurations != nil && conference.Configurations.COIWindowYears != nil {
		windowYears = *conference.Configurations.COIWindowYears
	}
	relationshipDetector.SetWindowYears(windowYears)

	// Check each author
	for authorEmail, author := range authorMap {
		hasConflict, err := relationshipDetector.CheckAuthorReviewerConflict(ctx, authorEmail, reviewerEmail)
		if err != nil {
			// Log error but continue checking others
			continue
		}

		if hasConflict {
			conflicting = append(conflicting, dto.ConflictingAuthor{
				Email:     authorEmail,
				FirstName: author.FirstName,
				LastName:  author.LastName,
				Reason:    fmt.Sprintf("Collaboration detected within %d years", windowYears),
			})
		}
	}

	return conflicting, nil
}
