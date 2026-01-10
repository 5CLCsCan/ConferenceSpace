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

	// 2. Add validation: Check if this semantic scholar ID is valid?
	// We skip strict validation here to be fast, but ideally we should check if author exists.
	// Since we are going to prefetch immediately, that serves as validation implicitly (though asynchronous).
	
	// 3. Update user profile
	status := "pending"
	user.SemanticScholarID = &req.SemanticScholarID
	user.ProfileSyncStatus = &status

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
		go func(authorID string, userID int64) {
			bgCtx := context.Background()
			
			// Fetch and sync to relational tables
			err := c.semanticScholarCtrl.SyncAuthorProfile(bgCtx, userID, authorID)
			
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
				// Use Update instead of UpdateByEmail
				_, _ = c.userStorage.Update(bgCtx, userID, currentUser.User)
			}
		}(req.SemanticScholarID, user.ID)
	}

	return updatedUser, nil
}
