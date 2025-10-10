package auth

import (
	"context"
	"net/http"

	"github.com/dcao/conferencespace/internal/dto/user"
	"github.com/gin-gonic/gin"
)

// ServiceInterface defines the interface for auth service
type ServiceInterface interface {
	Register(ctx context.Context, req *user.CreateRequest) (*user.Response, error)
	Login(ctx context.Context, req *user.LoginRequest) (*user.LoginResponse, error)
}

// Controller handles HTTP requests for authentication
type Controller struct {
	service ServiceInterface
}

// New creates a new auth controller
func New(service ServiceInterface) *Controller {
	return &Controller{service: service}
}

// Register handles POST /auth/register
func (c *Controller) Register(ctx *gin.Context) {
	var req user.CreateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := c.service.Register(ctx.Request.Context(), &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": response})
}

// Login handles POST /auth/login
func (c *Controller) Login(ctx *gin.Context) {
	var req user.LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := c.service.Login(ctx.Request.Context(), &req)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": response})
}

