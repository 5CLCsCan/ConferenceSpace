package user

import (
	"net/http"
	"strconv"

	userDto "github.com/dcao/conferencespace/internal/dto/user"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/storage"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	userStorage userStorage.StorageInterface
}

func New(store *storage.Storage) *Controller {
	return &Controller{
		userStorage: store.User,
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
// @Success      200 {object} user.ListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /users [get]
func (c *Controller) List(ginCtx *gin.Context, req *userDto.ListRequest) (*userDto.ListResponse, error) {
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

	return &userDto.ListResponse{
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
// @Success      200 {object} user.Response
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /users/{id} [get]
func (c *Controller) Get(ginCtx *gin.Context) (*userDto.Response, error) {
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
// @Success      200 {object} user.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /users/me [get]
func (c *Controller) GetMe(ginCtx *gin.Context) (*userDto.Response, error) {
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
// @Param        request body user.UpdateRequest true "Updated user data"
// @Success      200 {object} user.Response
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /users/{id} [put]
func (c *Controller) Update(ginCtx *gin.Context, req *userDto.UpdateRequest) (*userDto.Response, error) {
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
