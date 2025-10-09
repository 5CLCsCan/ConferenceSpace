package conference

import (
	"context"
	"net/http"
	"strconv"

	"github.com/dcao/conferencespace/internal/model/conference"
	"github.com/gin-gonic/gin"
)

// ServiceInterface defines the interface for conference service
type ServiceInterface interface {
	Create(ctx context.Context, req *conference.CreateRequest) (*conference.Conference, error)
	GetByID(ctx context.Context, id int64) (*conference.Conference, error)
	List(ctx context.Context) ([]*conference.Conference, error)
	Update(ctx context.Context, id int64, req *conference.UpdateRequest) (*conference.Conference, error)
	Delete(ctx context.Context, id int64) error
}

// Conference handles HTTP requests for conferences
type Conference struct {
	service ServiceInterface
}

// New creates a new conference controller
func New(service ServiceInterface) *Conference {
	return &Conference{service: service}
}

// List handles GET /conferences
func (c *Conference) List(ctx *gin.Context) {
	conferences, err := c.service.List(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": conferences})
}

// Get handles GET /conferences/:id
func (c *Conference) Get(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid conference ID"})
		return
	}

	conf, err := c.service.GetByID(ctx.Request.Context(), id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": conf})
}

// Create handles POST /conferences
func (c *Conference) Create(ctx *gin.Context) {
	var req conference.CreateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conf, err := c.service.Create(ctx.Request.Context(), &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": conf})
}

// Update handles PUT /conferences/:id
func (c *Conference) Update(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid conference ID"})
		return
	}

	var req conference.UpdateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conf, err := c.service.Update(ctx.Request.Context(), id, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": conf})
}

// Delete handles DELETE /conferences/:id
func (c *Conference) Delete(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid conference ID"})
		return
	}

	if err := c.service.Delete(ctx.Request.Context(), id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "conference deleted successfully"})
}

