package user

import (
	"context"
	"fmt"
	"net/http"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

// LinkProfileRequest represents the request to link an academic profile
type LinkProfileRequest struct {
	SemanticScholarID string `json:"semanticScholarId" binding:"required"`
}

// LinkAcademicProfile handles the linking of a Semantic Scholar profile
// @Summary      Link academic profile
// @Description  Link Semantic Scholar profile to user account and trigger sync
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request body LinkProfileRequest true "Profile details"
// @Success      200 {object} dto.UserResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Router       /users/link-academic-profile [post]
func (c *Controller) LinkAcademicProfile(ginCtx *gin.Context, req *LinkProfileRequest) (*dto.UserResponse, error) {
	ctx := ginCtx.Request.Context()

	// 1. Authenticate user
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	user, err := c.userStorage.GetByEmail(ctx, userEmail)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}
	if user.ProfileSyncStatus != nil && *user.ProfileSyncStatus == "pending" {
		return nil, handler.NewErrorResponse(http.StatusConflict, "profile sync is already in progress")
	}

	// 2. Add validation: Check if this semantic scholar ID is valid?
	// We skip strict validation here to be fast, but ideally we should check if author exists.
	// Since we are going to prefetch immediately, that serves as validation implicitly (though asynchronous).

	// 3. Update user profile
	status := "pending"
	user.SemanticScholarID = &req.SemanticScholarID
	user.ProfileSyncStatus = &status
	user.User.SemanticScholarIDSet = true
	user.User.ProfileSyncStatusSet = true

	// UpdateByEmail takes *dto.User.
	// Need to ensure the user object has the new fields set.
	// We are modifying the response object `user` which is *dto.UserResponse.
	// user.User is *dto.User.

	updatedUser, err := c.userStorage.UpdateByEmail(ctx, userEmail, user.User)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to update user profile")
	}

	// 4. Trigger background sync
	if c.semanticScholarCtrl != nil {
		authHeader := ginCtx.GetHeader("Authorization")
		go func(authorID string, userID int64, authToken string) {
			bgCtx := context.Background()

			// Fetch and sync to relational tables
			err := c.semanticScholarCtrl.SyncAuthorProfile(bgCtx, userID, authorID, authToken)

			// Update status based on result
			newStatus := "completed"
			if err != nil {
				fmt.Printf("Background sync failed for user %d: %v\n", userID, err)
				newStatus = "failed"
			}

			// Re-fetch user to get current state (using ID is safer/faster)
			currentUser, err := c.userStorage.GetByID(bgCtx, userID)
			if err == nil {
				currentUser.User.ProfileSyncStatus = &newStatus
				currentUser.User.ProfileSyncStatusSet = true
				// Use Update instead of UpdateByEmail
				_, _ = c.userStorage.Update(bgCtx, userID, currentUser.User)
			}
		}(req.SemanticScholarID, user.ID, authHeader)
	}

	return updatedUser, nil
}

// UnlinkAcademicProfile handles the unlinking of a Semantic Scholar profile
// @Summary      Unlink academic profile
// @Description  Remove the linked Semantic Scholar profile from user account
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} dto.UserResponse
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /users/unlink-academic-profile [post]
func (c *Controller) UnlinkAcademicProfile(ginCtx *gin.Context) (*dto.UserResponse, error) {
	ctx := ginCtx.Request.Context()

	// 1. Authenticate user
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	user, err := c.userStorage.GetByEmail(ctx, userEmail)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}

	// 2. Check if user has a linked profile
	if user.SemanticScholarID == nil || *user.SemanticScholarID == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "no academic profile linked")
	}
	if user.ProfileSyncStatus != nil && *user.ProfileSyncStatus == "pending" {
		return nil, handler.NewErrorResponse(http.StatusConflict, "cannot unlink while profile sync is in progress")
	}

	// 3. Delete scholar profile data
	if c.scholarStorage != nil {
		err = c.scholarStorage.DeleteProfileByUserID(ctx, user.ID)
		if err != nil {
			fmt.Printf("Warning: failed to delete scholar profile for user %d: %v\n", user.ID, err)
			// Continue anyway - the main goal is to unlink from user record
		}
	}

	// 4. Clear user's semantic scholar fields
	user.SemanticScholarID = nil
	user.ProfileSyncStatus = nil
	user.User.SemanticScholarIDSet = true
	user.User.ProfileSyncStatusSet = true

	updatedUser, err := c.userStorage.UpdateByEmail(ctx, userEmail, user.User)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to update user profile")
	}

	return updatedUser, nil
}
