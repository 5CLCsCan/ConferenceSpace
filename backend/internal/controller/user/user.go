package user

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/dcao/conferencespace/internal/assignment"
	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/storage"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	userStorage       userStorage.StorageInterface
	submissionStorage submissionStorage.StorageInterface
	conferenceStorage conferenceStorage.StorageInterface
	assignmentService *assignment.Service
}

func New(store *storage.Storage, assignmentService *assignment.Service) *Controller {
	return &Controller{
		userStorage:       store.User,
		submissionStorage: store.Submission,
		conferenceStorage: store.Conference,
		assignmentService: assignmentService,
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

	return &dto.UserListResponse{
		Users: users,
		Total: total,
	}, nil
}

// Get godoc
// @Summary      Get user by ID
// @Description  Get a specific user by their ID
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "User ID"
// @Success      200 {object} dto.UserResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /users/{id} [get]
func (c *Controller) Get(ginCtx *gin.Context) (*dto.UserResponse, error) {
	ctx := ginCtx.Request.Context()

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid user ID")
	}

	user, err := c.userStorage.GetByID(ctx, id)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
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

	userID, exists := utils.GetUserID(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	user, err := c.userStorage.GetByID(ctx, userID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}
	return user, nil
}

// Update godoc
// @Summary      Update user
// @Description  Update user profile (only own profile)
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "User ID"
// @Param        request body dto.UserUpdateRequest true "Updated user data"
// @Success      200 {object} dto.UserResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /users/{id} [put]
func (c *Controller) Update(ginCtx *gin.Context, req *dto.UserUpdateRequest) (*dto.UserResponse, error) {
	ctx := ginCtx.Request.Context()

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid user ID")
	}

	userID, exists := utils.GetUserID(ginCtx)
	if !exists || userID != id {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "you can only update your own profile")
	}

	if req.User == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "user data is required")
	}

	return c.userStorage.Update(ctx, id, req.User)
}

// Search godoc
// @Summary      Search users
// @Description  Search users by email (for autocomplete/lookup)
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        q query string true "Search query (email)"
// @Param        limit query int false "Limit results (default: 10)"
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
// @Param        id path int true "User ID"
// @Success      200 {object} map[string]string
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Router       /users/{id} [delete]
func (c *Controller) Delete(ginCtx *gin.Context) error {
	ctx := ginCtx.Request.Context()

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid user ID")
	}

	userID, exists := utils.GetUserID(ginCtx)
	if !exists || userID != id {
		return handler.NewErrorResponse(http.StatusForbidden, "you can only delete your own account")
	}

	return c.userStorage.Delete(ctx, id)
}

// CheckCOI godoc
// @Summary      Check COI for a user against conference authors
// @Description  Check if a potential reviewer has conflicts of interest with authors in a conference
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "User ID (potential reviewer)"
// @Param        conference_id query int true "Conference ID"
// @Success      200 {object} dto.UserCOICheckResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /users/{id}/coi-check [get]
func (c *Controller) CheckCOI(ginCtx *gin.Context, req *dto.UserCOICheckRequest) (*dto.UserCOICheckResponse, error) {
	ctx := ginCtx.Request.Context()

	// Validate conference_id is provided
	if req.ConferenceID == 0 {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "conference_id is required")
	}

	// Get the user being checked
	user, err := c.userStorage.GetByID(ctx, req.UserID)
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
