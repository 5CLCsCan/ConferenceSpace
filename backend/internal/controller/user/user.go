package user

import (
	"context"
	"net/http"
	"strconv"

	"github.com/dcao/conferencespace/internal/dto/user"
	"github.com/dcao/conferencespace/internal/middleware"
	"github.com/gin-gonic/gin"
)

// ServiceInterface defines the interface for user service
type ServiceInterface interface {
	GetByID(ctx context.Context, id int64) (*user.Response, error)
	List(ctx context.Context) ([]*user.Response, error)
	Update(ctx context.Context, id int64, req *user.UpdateRequest) (*user.Response, error)
	Delete(ctx context.Context, id int64) error
}

// Controller handles HTTP requests for users
type Controller struct {
	service ServiceInterface
}

// New creates a new user controller
func New(service ServiceInterface) *Controller {
	return &Controller{service: service}
}

// List handles GET /users
func (c *Controller) List(ctx *gin.Context) {
	users, err := c.service.List(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": users})
}

// Get handles GET /users/:id
func (c *Controller) Get(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user, err := c.service.GetByID(ctx.Request.Context(), id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": user})
}

// GetMe handles GET /users/me (get current authenticated user)
func (c *Controller) GetMe(ctx *gin.Context) {
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	user, err := c.service.GetByID(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": user})
}

// Update handles PUT /users/:id
func (c *Controller) Update(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	// Check if user is updating their own profile
	userID, exists := middleware.GetUserID(ctx)
	if !exists || userID != id {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "you can only update your own profile"})
		return
	}

	var req user.UpdateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedUser, err := c.service.Update(ctx.Request.Context(), id, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": updatedUser})
}

// Delete handles DELETE /users/:id
func (c *Controller) Delete(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	// Check if user is deleting their own account
	userID, exists := middleware.GetUserID(ctx)
	if !exists || userID != id {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "you can only delete your own account"})
		return
	}

	if err := c.service.Delete(ctx.Request.Context(), id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "user deleted successfully"})
}

