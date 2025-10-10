package user

import (
	"net/http"
	"strconv"

	userDto "github.com/dcao/conferencespace/internal/dto/user"
	userEntity "github.com/dcao/conferencespace/internal/entity/user"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/middleware"
	"github.com/dcao/conferencespace/internal/storage"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	storage userStorage.StorageInterface
}

func New(store *storage.Storage) *Controller {
	return &Controller{
		storage: store.User,
	}
}

func (c *Controller) List(ctx *gin.Context) ([]*userDto.Response, error) {
	users, err := c.storage.List(ctx.Request.Context())
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	responses := make([]*userDto.Response, len(users))
	for i, u := range users {
		responses[i] = c.entityToResponse(u)
	}

	return responses, nil
}

func (c *Controller) Get(ctx *gin.Context) (*userDto.Response, error) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid user ID")
	}

	user, err := c.storage.GetByID(ctx.Request.Context(), id)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}

	return c.entityToResponse(user), nil
}

func (c *Controller) GetMe(ctx *gin.Context) (*userDto.Response, error) {
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	user, err := c.storage.GetByID(ctx.Request.Context(), userID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}

	return c.entityToResponse(user), nil
}

func (c *Controller) Update(ctx *gin.Context, req *userDto.UpdateRequest) (*userDto.Response, error) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid user ID")
	}

	userID, exists := middleware.GetUserID(ctx)
	if !exists || userID != id {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "you can only update your own profile")
	}

	updatedUser, err := c.storage.Update(
		ctx.Request.Context(),
		id,
		req.Email,
		req.FirstName,
		req.LastName,
		req.Domain,
	)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return c.entityToResponse(updatedUser), nil
}

func (c *Controller) Delete(ctx *gin.Context) error {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid user ID")
	}

	userID, exists := middleware.GetUserID(ctx)
	if !exists || userID != id {
		return handler.NewErrorResponse(http.StatusForbidden, "you can only delete your own account")
	}

	if err := c.storage.Delete(ctx.Request.Context(), id); err != nil {
		return handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return nil
}

func (c *Controller) entityToResponse(user *userEntity.User) *userDto.Response {
	return &userDto.Response{
		UserID:    user.UserID,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Domain:    user.Domain,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
}
